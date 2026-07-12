import express from "express";
import pg from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me";
const PROJECT_NAME = process.env.PROJECT_NAME || "Your name";

if (!DATABASE_URL) { console.error("Missing DATABASE_URL. Add a Postgres database in Railway."); process.exit(1); }

const noSslNeeded =
  process.env.PGSSL === "false" ||
  DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1") || DATABASE_URL.includes("host=/");

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: noSslNeeded ? false : { rejectUnauthorized: false } });

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      display_name TEXT,
      bio TEXT,
      CONSTRAINT single_row CHECK (id = 1)
    );
    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  // Seed profile row if missing
  await pool.query(
    "INSERT INTO profile (id, display_name, bio) VALUES (1, $1, $2) ON CONFLICT (id) DO NOTHING",
    [PROJECT_NAME, "Welcome — here's where to find me."]
  );
  console.log("Database ready.");
}

function safeUrl(u){
  try { const x = new URL(u); return (x.protocol === "http:" || x.protocol === "https:") ? x.href : null; }
  catch { return null; }
}

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

// Public: profile + links
app.get("/api/page", async (req, res) => {
  const p = await pool.query("SELECT display_name, bio FROM profile WHERE id = 1");
  const l = await pool.query("SELECT id, label, url FROM links ORDER BY position, id");
  res.json({ profile: p.rows[0] || { display_name: PROJECT_NAME, bio: "" }, links: l.rows });
});

// Public: click-through redirect (tracks clicks)
app.get("/go/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { rows } = await pool.query("SELECT url FROM links WHERE id = $1", [id]);
  if (!rows.length) return res.redirect("/");
  await pool.query("UPDATE links SET clicks = clicks + 1 WHERE id = $1", [id]);
  res.redirect(rows[0].url);
});

function checkAdmin(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (token !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/api/admin/data", checkAdmin, async (req, res) => {
  const p = await pool.query("SELECT display_name, bio FROM profile WHERE id = 1");
  const l = await pool.query("SELECT * FROM links ORDER BY position, id");
  res.json({ profile: p.rows[0], links: l.rows });
});

app.post("/api/admin/profile", checkAdmin, async (req, res) => {
  const name = (req.body.display_name || "").trim();
  const bio = (req.body.bio || "").trim();
  await pool.query("UPDATE profile SET display_name=$1, bio=$2 WHERE id=1", [name, bio]);
  res.json({ ok: true });
});

app.post("/api/admin/link", checkAdmin, async (req, res) => {
  const label = (req.body.label || "").trim();
  const url = safeUrl((req.body.url || "").trim());
  if (!label) return res.status(400).json({ error: "Label is required." });
  if (!url) return res.status(400).json({ error: "Enter a valid http(s) URL." });
  await pool.query("INSERT INTO links (label, url) VALUES ($1,$2)", [label, url]);
  res.json({ ok: true });
});

app.post("/api/admin/link/delete", checkAdmin, async (req, res) => {
  const id = parseInt(req.body.id, 10);
  await pool.query("DELETE FROM links WHERE id = $1", [id]);
  res.json({ ok: true });
});

initDb()
  .then(() => app.listen(PORT, () => console.log(`Onelink running on port ${PORT}`)))
  .catch((err) => { console.error("Failed to start:", err); process.exit(1); });
