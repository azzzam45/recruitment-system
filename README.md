# Recruitment System

A job board API with a plain HTML/JS front end. Candidates browse and apply to jobs; recruiters post jobs and manage applications.

## Stack

- **API**: Express 5
- **Database**: MongoDB (Mongoose), replica set required for change streams
- **Cache**: Redis (job listing cache, rate limiting)
- **Search**: Elasticsearch (full-text job search), kept in sync with MongoDB via a change stream
- **Background jobs**: BullMQ on Redis (welcome emails, reminders, daily report), monitorable via Bull Board at `/admin/queues`
- **Auth**: JWT (`jsonwebtoken`) + `bcryptjs` for password hashing
- **Front end**: static HTML/CSS/JS in `public/`, no build step

## Project layout

```
config/        DB, Redis, Elasticsearch connections + Mongo change-stream sync
controllers/   Route handler logic
middlewares/   JWT auth (protect/authorize), Redis-based rate limiting
models/        Mongoose schemas (User, Job, Application)
public/        Static front end (index/login/register/candidate/recruiter)
queues/        BullMQ queue + worker for email/notification jobs
routes/        Express routers
index.js       App entry point
```

## Environment variables

Copy `env.example` to `.env` and fill in real values:

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | HTTP port the API listens on | `8002` |
| `MONGO_URI` | MongoDB connection string (replica set required) | `mongodb://mongo:27017/recruitment_system_db?replicaSet=rs0` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `ELASTICSEARCH_NODE` | Elasticsearch endpoint | `http://elasticsearch:9200` |
| `JWT_SECRET` | Secret used to sign/verify auth tokens — required, no default | a long random string |

`.env` is gitignored; never commit real secrets.

## Running with Docker Compose (recommended)

Docker Compose reads `.env` in the project root for variable substitution (used for `JWT_SECRET`), so create it first:

```bash
cp env.example .env
# edit .env and set a real JWT_SECRET
docker-compose up --build
```

This starts the API plus MongoDB (with replica set `rs0` initialized automatically), Redis, and Elasticsearch. The API is available at `http://localhost:8002`.

## Running locally (without Docker)

Requires a local MongoDB replica set, Redis, and Elasticsearch instance reachable at the URLs in `.env`.

```bash
npm install
cp env.example .env
# edit .env for your local services
npm run dev   # nodemon, auto-restart
# or
npm start
```

## Key routes

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/jobs`, `GET /api/jobs/search?q=`, `GET /api/jobs/my-jobs`, `POST /api/jobs`, `DELETE /api/jobs/:id`
- `POST /api/applications`, `GET /api/applications/my-applications`, `GET /api/applications/recruiter/dashboard`, `PATCH /api/applications/:id/status`
- `GET /admin/queues` — Bull Board queue monitoring dashboard
