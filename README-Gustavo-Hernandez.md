# Full-Stack Todo Sync Application

This repository contains a full-stack Todo application with a NestJS backend, a React + Vite frontend, PostgreSQL persistence, JWT authentication, and synchronization with an external Todo service.

## Project Overview

The application allows users to manage TodoLists and nested TodoItems through a protected frontend. It also supports synchronization with an external Todo API, including:

- TodoList and TodoItem CRUD operations
- JWT-based authentication for protected Todo endpoints
- Bidirectional sync between local state and an external Todo service
- Scheduled background sync every 5 minutes
- Retry support for transient local and external failures

## Notes

- Login with `admin` / `password` at `POST /auth/login`
- Protected Todo routes are under `/api/todolists`
- Manual sync is available at `POST /api/todolists/sync`
- External API URL uses `EXTERNAL_API_URL` or defaults to `http://localhost:3001`

## Tech Stack

- **Backend**: NestJS, TypeScript, TypeORM, Axios, `@nestjs/schedule`
- **Frontend**: React, Vite, Material UI, Axios
- **Database**: PostgreSQL
- **Infrastructure**: Docker, Docker Compose

## Features

- Manage TodoLists with nested TodoItems
- Create, update, and delete TodoLists and items
- JWT login with protected `/api/todolists` routes
- Manual sync via `POST /api/todolists/sync`
- Scheduled cron sync every 5 minutes
- Input validation and request logging on the backend

## Running the project

### Backend using Docker

From the `nestjs-interview` folder:

```bash
cd /workspaces/nestjs-interview
docker compose up --build
```

This starts the NestJS backend on `http://localhost:3000` and a PostgreSQL database on port `5432`.

### Backend without Docker

```bash
cd /workspaces/nestjs-interview
npm install
npm run start
```

### Frontend

```bash
cd /workspaces/react-interview
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Testing

From `nestjs-interview`:

```bash
npm run test
npm run test:cov
```

## Authentication

### Login endpoint

Request:

```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

Response:

```json
{
  "access_token": "<jwt>"
}
```

### Protected endpoints

Include the JWT in the `Authorization` header:

```http
Authorization: Bearer <token>
```

## API Endpoints

- `GET /api/todolists` - fetch all TodoLists
- `POST /api/todolists` - create a new TodoList
- `PUT /api/todolists/{todoListId}` - update a TodoList
- `DELETE /api/todolists/{todoListId}` - delete a TodoList
- `POST /api/todolists/sync` - trigger manual sync with the external Todo API

## Sync behavior

The backend sync service performs two phases:

1. External → Local: fetch external TodoLists and create any missing local lists by name
2. Local → External: create and update external lists/items for local data that does not already exist externally

### Response format

`POST /api/todolists/sync` returns:

- `success` boolean
- `createdLocal` number of lists imported from external service
- `createdExternal` number of lists/items created in the external service
- `updatedExternal` number of external lists/items updated to match local data
- `failed` number of operations that failed after two retry attempts

### Matching rules and limitations

- Lists are matched by `name`
- Items are matched by external `description`
- There is no stable cross-service ID mapping in the current implementation
- Deletions are not reconciled across systems
- The local frontend currently presents a simplified sync summary after the operation

## External API configuration

The external Todo API base URL is configured with `EXTERNAL_API_URL`. If that environment variable is not set, the backend defaults to:

```bash
EXTERNAL_API_URL=http://localhost:3001
```

> The external service is not included in this repository, so end-to-end sync requires a compatible external Todo API.

## Important notes

- Global validation is enabled in `src/main.ts` with `ValidationPipe`
- Backend logging is enabled via `LoggingInterceptor`
- Frontend API requests use a stored JWT token from local storage

## Future improvements

- Add stable external IDs and timestamp-based change detection
- Implement delta sync and two-way reconciliation
- Introduce queue-based background sync processing
- Improve frontend sync UX with richer progress details
- Harden error handling and retry policies
