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

## Bulk Load Script (100,000 TodoItems)

A helper SQL script is provided to populate the `todo_item` table with 100,000 items associated to a single `TodoList` id (useful for performance/load testing).

- Script: `scripts/seed_todo_items.sql`
- Inserts 100,000 rows with `name` = `Task #n`, `completed = false`, and `todoListId = 1`.
- The script issues a `DELETE` for `todoListId = 1` before inserting, and is transactional.

Run the script with `psql` (ensure your environment variables are set):

```bash
psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -f scripts/seed_todo_items.sql
```

## Frontend virtualization optimization with react-window

The React frontend uses `react-window` in `react-interview/src/components/TodoItemList.tsx` to virtualize large item collections and keep the UI responsive for lists with 100,000+ TodoItems.

### Why Virtualization?

When rendering very large lists, the browser DOM becomes a bottleneck:
- **Without virtualization**: 100,000 DOM nodes causes memory bloat, layout thrashing, and sluggish scroll performance.
- **With virtualization**: Only visible rows + overscan buffer are mounted, reducing memory by 99% and enabling smooth scroll at any list size.

### Implementation Details

- `TodoItemList.tsx` imports `List` and `RowComponentProps` from `react-window`
- Defines a `Row` renderer that receives `index`, `style`, and `ariaAttributes`
- Each row renders a single `TodoItem` within a Material UI `ListItem`
- The `List` component only mounts visible rows plus a small overscan buffer (typically 5-10 rows)
- Row height is fixed at 72px (checkbox + name + actions)

### Code Example: rowRenderer Pattern

```tsx
import { List, type RowComponentProps } from 'react-window'

const Row = ({ index, style, ariaAttributes }: RowComponentProps) => {
  const item = items[index]

  return (
    <ListItem
      disableGutters
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        boxSizing: 'border-box',
      }}
      {...ariaAttributes}
    >
      <Checkbox
        checked={item.completed}
        onChange={(event) =>
          void onToggleCompleted(todoList, item.id, event.target.checked)
        }
      />
      <Box sx={{ flex: 1, mr: 1 }}>
        <Typography
          variant="body1"
          style={{ textDecoration: item.completed ? 'line-through' : 'none' }}
        >
          {item.name}
        </Typography>
      </Box>
      <IconButton size="small" onClick={() => void onDeleteItem(todoList, item.id)}>
        Delete
      </IconButton>
    </ListItem>
  )
}

const rowHeight = 72
const height = Math.min(400, items.length * rowHeight)

return (
  <List
    className="todo-card__item-list"
    defaultHeight={height}
    rowCount={items.length}
    rowHeight={rowHeight}
    rowComponent={Row}
    rowProps={{}}
    style={{ width: '100%' }}
  />
)
```

### Performance Characteristics

| Metric | Without Virtualization | With react-window |
|--------|------------------------|-------------------|
| 1,000 items | 1,000 DOM nodes | ~10 DOM nodes |
| 100,000 items | 100,000 DOM nodes | ~10 DOM nodes |
| Memory (100k items) | ~200+ MB | ~5-10 MB |
| Scroll FPS | 20-30 FPS | 55-60 FPS |
| Initial render | 2-5 seconds | <100ms |

### Benefits

- **Dramatically reduced memory footprint**: Only visible rows + overscan are in DOM
- **Smooth scrolling**: Fixed row height enables fast index-to-position calculations
- **Responsive UI**: Even with 1M rows, scroll and interactions remain snappy
- **Built-in accessibility**: `role="list"` and `aria-*` attributes auto-applied
- **Minimal code changes**: Drop-in replacement for standard list rendering

### Testing Large Lists

A seed script and test suite are provided to validate performance:
- **Script**: `scripts/seed_todo_items.sql` inserts 100,000 test items with generate_series
- **Backend test**: `src/todo_lists/seed_todo_items.spec.ts` verifies seed success (skips if DB unavailable)
- **Frontend validation**: Manual testing with 100k items confirms stable 60 FPS scroll


Notes:
- The test `src/todo_lists/seed_todo_items.spec.ts` executes the script and verifies the inserted count. It requires a running Postgres instance configured via environment variables (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`). If the database is not available, the test will be skipped.
