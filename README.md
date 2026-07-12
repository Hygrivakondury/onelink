# Deploy and Host Onelink

Onelink is a self-hosted link-in-bio page you deploy in one click. Show a name, a short bio, and a set of tappable link buttons on a clean public page, and manage everything from a private editor with click tracking — all on infrastructure you own, with no monthly SaaS fee.

## About Hosting Onelink
Onelink runs as a single Node.js service backed by a Postgres database, both included in this template. On deploy, the app creates its tables automatically and serves your public link page at the root URL. You edit your name, bio, and links from a password-protected editor at /admin.html, and each link tracks how many times it was clicked. Set ADMIN_PASSWORD to secure the editor and PROJECT_NAME as your starting display name; the database connection is wired automatically.

## Common Use Cases
- A link-in-bio page for creators, founders, and authors
- A simple personal landing page you fully control
- A self-hosted, own-your-data alternative to hosted bio-link services

## Dependencies for Onelink Hosting
- A Postgres database (included and auto-connected)
- Node.js 18+ runtime (handled by Railway)

### Deployment Dependencies
- Source: https://github.com/YOUR_GITHUB/onelink

## Why Deploy Onelink on Railway?
Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying Onelink on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.
