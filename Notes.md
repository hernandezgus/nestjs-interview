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

