# NOTES.md

## Context
Technical challenge focused on extending an existing system with:
- NestJS backend (TypeORM)
- React + Vite frontend
- PostgreSQL
- Docker-based setup

## Objectives
- Deliver working features within ~6 hours
- Apply solid engineering practices pragmatically
- Use AI as a structured development assistant (prompt-driven approach)

## Non-negotiable requirements
- JWT authentication
- Logging
- Tests
- Docker compatibility

## Working Principles
- Prefer incremental, testable changes
- Prioritize clarity over over-engineering
- Document trade-offs explicitly
- Maintain compatibility with existing setup

## Strategy
- Start with backend hardening (logging, errors)
- Then security (JWT)
- Then frontend integration
- Add tests in parallel
- Document decisions continuously

## Increment 1 — Validation and Error Handling

### Decision
Implemented request validation and explicit error handling to improve API reliability.

### Changes
- Enabled global ValidationPipe (whitelist, transform, forbidNonWhitelisted)
- Added class-validator decorators to DTOs
- Replaced manual param casting with ParseIntPipe
- Replaced null returns with NotFoundException

### Rationale
- Ensures data integrity at the API boundary
- Makes API behavior predictable for clients
- Reduces risk of silent failures and inconsistent states

### Trade-offs
- Slight increase in verbosity (DTO decorators)
- Did not implement global exception filters yet to keep scope small

### Future Improvements
- Add global exception filter for consistent error format
- Introduce request/response logging tied to validation errors

## Increment 2 — Request Logging

### Decision
Implemented a global logging interceptor to track all HTTP requests.

### Changes
- Created LoggingInterceptor
- Logs request start, response, execution time, and errors
- Applied globally in main.ts

### Rationale
- Provides centralized observability without polluting business logic
- Improves debugging and monitoring capabilities
- Follows NestJS best practices (interceptors for cross-cutting concerns)

### Trade-offs
- Not using structured JSON logging yet
- No correlation IDs implemented
- Using built-in Logger instead of external libraries

### Future Improvements
- Add correlation IDs for distributed tracing
- Integrate structured logging (e.g., Winston, Pino)
- Send logs to external systems

## Increment 3 — JWT Authentication

### Decision
Implemented JWT-based authentication using Passport strategy.

### Changes
- Created AuthModule with login endpoint
- Added JWT strategy and guard
- Protected TodoLists endpoints
- Used a hardcoded user for authentication

### Rationale
- Enables secure API access with minimal implementation
- Keeps system stateless and easy to integrate with frontend
- Leaves room for future user management extension

### Trade-offs
- No persistent user storage
- No role-based access control
- Simple credential validation

### Future Improvements
- Add user entity and persistence
- Implement roles/permissions
- Add refresh tokens

## Increment 4 — TodoItems Domain

### Decision
Extended TodoList domain to include TodoItems with a one-to-many relationship.

### Changes
- Created TodoItem entity
- Added OneToMany / ManyToOne relationship
- Enabled cascade operations
- Updated DTOs to support nested creation
- Implemented nested validation

### Rationale
- Enables creating full TodoLists with items in a single request
- Aligns with requirement of managing lists and items together
- Keeps implementation simple and efficient for current scope

### Trade-offs
- Using eager loading simplifies implementation but may impact performance at scale
- Update strategy replaces items instead of diffing changes

### Future Improvements
- Optimize loading strategy (lazy loading or query builder)
- Implement partial updates for items
- Introduce transactions for complex updates

## Increment 5 — Frontend Implementation

### Decision
Implemented a minimal but structured React frontend using MUI.

### Changes
- Created API abstraction layer
- Implemented login flow with JWT storage
- Built TodoLists UI with nested items
- Organized code by feature

### Rationale
- Enables full-stack interaction with backend
- Keeps structure scalable without over-engineering
- Improves developer productivity with UI library

### Trade-offs
- No global state manager
- Basic error handling only
- Limited UI features

### Future Improvements
- Add React Query for data fetching
- Improve form handling
- Add routing and navigation

## Increment 5.1 — UI/UX Improvements and Full CRUD

### Decision
Expanded UI to support full CRUD operations for TodoLists and TodoItems.

### Changes
- Added edit and delete functionality for TodoLists
- Added create, edit, delete, and toggle completion for TodoItems
- Implemented inline editing
- Improved visual feedback for completed items

### Rationale
- Completes the core user workflow
- Improves usability and interaction efficiency
- Ensures frontend fully exercises backend capabilities

### Trade-offs
- Basic UX (not polished)
- No advanced state management
- No optimistic updates in all cases

### Future Improvements
- Add better state synchronization (React Query)
- Improve UI interactions and animations
- Add filtering and sorting

## Increment 6.1 — Sync Improvements

### Enhancements
- Added retry mechanism
- Added result reporting (created/failed)
- Introduced scheduled sync (cron)
- Added UI integration for manual sync

### Rationale
- Improves reliability and observability
- Enables operational control
- Makes sync user-visible

### Trade-offs
- Basic retry only (no exponential backoff)
- Cron not distributed-safe
- No queue system

### Future Improvements
- Introduce job queue (BullMQ)
- Add exponential retry
- Add sync audit logs