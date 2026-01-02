# Technical Specification

## Project Structure
```
backend/
  Dockerfile
  package.json
  knexfile.js
  migrations/
  seeds/
  src/
    app.js
    server.js
    config/
    controllers/
    middleware/
    routes/
    services/
    utils/
frontend/
  Dockerfile
  package.json
  vite.config.js
  src/
    App.jsx
    main.jsx
    pages/
    components/
    context/
    services/
  index.html
docs/
  research.md
  PRD.md
  architecture.md
  technical-spec.md
  api.md (to add examples)
  images/
.env
```

## Backend Notes
- Express app with modular routers per resource.
- Knex migrations/seeds auto-run on server start for Docker.
- JWT-based auth; middleware checks roles.
- Plan limits enforced in services before create operations.

## Frontend Notes
- React + Vite SPA.
- React Router for pages: registration, login, dashboard, projects list, project detail, users list.
- Axios client with Bearer token injection; protected routes redirect to login.

## Development Setup
Prereqs: Node.js 20+, Docker 24+, npm.

Local (without Docker):
1. `cd backend && npm install`
2. `npm run dev` (ensure Postgres running and DATABASE_URL set).
3. `cd ../frontend && npm install`
4. `npm run dev` (Vite on 3000).

Docker (one command):
- From repo root: `docker-compose up -d`

Environment variables (see `.env` committed for dev values): POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, DATABASE_URL, PORT, JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGIN, VITE_API_BASE_URL.

## Testing
- (Placeholder) Add backend unit/integration tests under `backend/tests`.
- Manual QA via frontend pages hitting dockerized backend.

## Future Enhancements
- Add Joi validation per route.
- Enable PostgreSQL RLS for double isolation.
- Add rate limiting and request ID tracing.
- CI pipeline to run lint/tests and build containers.
