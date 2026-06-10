# Full-Stack Todo Sync Application

This repository contains a full-stack Todo application with a NestJS backend, a React + Vite frontend, PostgreSQL persistence, JWT authentication, and synchronization to an external Todo API.

## Project Overview

The application allows users to manage TodoLists and nested TodoItems through a protected frontend. It also supports synchronization with an external Todo service, including:

- Todo management with create, read, update, and delete operations
- External API synchronization for importing missing lists
- Full-stack architecture with separate backend and frontend projects

## Tech Stack

- **Backend**: NestJS, TypeScript, TypeORM, Axios, `@nestjs/schedule`
- **Frontend**: React, Vite, Material UI, Axios
- **Database**: PostgreSQL
- **Infrastructure**: Docker, Docker Compose

## Features

### Core features

- Manage TodoLists and nested TodoItems
- Create TodoLists with items
- Update list names and item state
- Delete lists and items

### Authentication

- JWT-based login
- Protected Todo API routes under `/api/todolists`

### Observability

- Backend request logging
- Input validation on DTOs
- Error handling and structured responses

### Sync

- Manual sync via `/api/todolists/sync`
- Scheduled sync using cron every 5 minutes
- Retry support for local create operations
- Sync status reported back to the client

## Architecture Overview

### Backend structure

- `nestjs-interview/src/app.module.ts` - application bootstrapping and database configuration
- `nestjs-interview/src/auth` - authentication module, JWT login, validation
- `nestjs-interview/src/todo_lists` - domain module for TodoLists and TodoItems
- `nestjs-interview/src/todo_lists/todo_sync.service.ts` - synchronization logic
- `nestjs-interview/src/todo_lists/external_todo_api.service.ts` - external API client

### Frontend structure

- `react-interview/src/pages/TodoListsPage.tsx` - main page with Todo list UI and sync control
- `react-interview/src/components` - reusable UI components for Todo list forms and cards
- `react-interview/src/hooks/useTodoLists.ts` - state management and API interaction
- `react-interview/src/api/todoLists.ts` - Todo API client, including sync endpoint

### Sync design

Sync is implemented as a one-way import from the external API into the local database. The backend fetches all remote TodoLists, compares by list name, and creates missing local lists with associated items.

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

## API usage

### Login example

Request:

```http
POST /auth/login
Content-Type: application/json

{
  "username": "user",
  "password": "password"
}
```

Response contains a JWT token.

### Protected endpoints

Include the JWT in the `Authorization` header:

```http
Authorization: Bearer <token>
```

Key Todo endpoints:

- `GET /api/todolists` - fetch all TodoLists
- `POST /api/todolists` - create a new TodoList
- `PUT /api/todolists/{todoListId}` - update a TodoList
- `DELETE /api/todolists/{todoListId}` - delete a TodoList

### Sync endpoint

- `POST /api/todolists/sync` - trigger manual sync from the external Todo API

Response includes:

- `success` boolean
- `created` count of new lists created
- `failed` count of items that could not be created
- optional `message`

## Sync explanation

### How sync works

The backend sync service fetches TodoLists from the external API and compares them to local TodoLists by name. If an external list does not exist locally, it is created with its nested items.

### Assumptions

- List `name` is used as the identifier for matching external and local TodoLists
- Remote lists without matching local names are considered new

### Limitations

- No stable external ID mapping is available in the current sync implementation
- Sync is one-way from external API to local database
- The external API does not support incremental delta queries or full change tracking
- Conflict resolution is intentionally simple to keep the implementation focused and maintainable

## AI-First Development Approach

This repository was developed with iterative AI assistance. Each change was produced in small, testable increments, and the implementation was validated through code updates and compilation checks.

The AI-assisted workflow included:

- generating code for backend and frontend features
- analyzing build and runtime issues
- refining the sync design based on project constraints
- ensuring the final implementation remained practical and maintainable

Prompts were refined iteratively to focus on working code, clear logging, and minimal complexity.

## Trade-offs

- The sync design favors simplicity over full reconciliation logic
- No advanced conflict resolution or bidirectional merge is implemented
- Cron-based sync runs every 5 minutes, which is suitable for this challenge but not a production-grade queue-based system

## Future Improvements

- Add stable external IDs and timestamp-based change detection
- Implement delta sync and two-way reconciliation
- Introduce queue-based background processing for sync operations
- Improve frontend sync UX with richer progress and status details
- Harden error handling and retry policies for external API failures
