# Vistula Task Manager

Simple Task Manager built with HTML, CSS and JavaScript, using the Supabase REST API (PostgreSQL) and hosted on GitHub Pages.

- **Student ID:** 71536
- **Live application:** https://wonkiest29.github.io/tskmgr/
- **Repository:** https://github.com/Wonkiest29/tskmgr
- **Contributor page:** https://wonkiest29.github.io/tskmgr/contribution.html
- **Contributor JSON:** https://wonkiest29.github.io/tskmgr/contribution.json

## Features

- Display all tasks (`GET /tasks?select=*`)
- Get a task by ID (`GET /tasks?id=eq.ID&select=*`)
- Add a task (`POST /tasks`)
- Edit a task and toggle completion (`PUT /tasks?id=eq.ID`)
- Delete a task (`DELETE /tasks?id=eq.ID`)

All data is stored in the Supabase `tasks` table (`id`, `title`, `description`, `completed`).

## Team collaboration (Pull Requests)

- **Pull Request I created in my partner's repository:** https://github.com/PARTNER_USERNAME/vistula-task-manager/pull/1
- **Pull Request from my partner merged into this repository:** https://github.com/Wonkiest29/tskmgr/pull/1

## Files

- `index.html` – main page
- `app.js` – application logic (Supabase REST API via `fetch()`)
- `config.json` – public Supabase configuration (publishable key only)
- `style.css` – styles
- `contribution.html`, `contribution.json` – added by my partner via Pull Request
