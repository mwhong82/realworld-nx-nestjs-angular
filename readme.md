# ![RealWorld Example App](logo.png)

> ### [Nx monorepo](https://nx.dev) with [Nestjs](https://nestjs.com) and [Angular](https://angular.io) codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld) spec and API.

This codebase was created to demonstrate a fully fledged fullstack application built with **[Nx monorepo](https://nx.dev), [Nestjs](https://nestjs.com) and [Angular](https://angular.io)** including CRUD operations, authentication, routing, pagination, and more.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Monorepo | Nx | 11.5.2 |
| Backend | NestJS | 7.0 |
| Frontend | Angular | 11.2 |
| Database | MySQL + TypeORM | 0.2.31 |
| Auth | JWT + Passport + bcrypt | |
| Testing | Jest + Cypress | 26.2.2 / 6.0 |
| UI | Bootstrap 4.5 + ng-bootstrap | |

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14+)
- [MySQL](https://www.mysql.com/) server running on localhost:3306

### Setup

```bash
# Clone the repository
git clone https://github.com/mwhong82/realworld-nx-nestjs-angular.git
cd realworld-nx-nestjs-angular

# Install dependencies
npm install

# Configure database
# Edit ormconfig.js: host, port, username, password, database

# Run database migrations
npm run migration:run

# (Optional) Import sample data
# Import realworld-dump-data-exported.sql into your MySQL database

# Start both API and frontend
npm run serve:api-conduit
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

### Test Accounts (with sample data)
- `user1@email.com` / `qwerty1`
- `user2@email.com` / `qwerty1`

## Architecture

```
apps/
├── api/                NestJS REST API (port 3000)
├── conduit/            Angular SPA (port 4200)
└── conduit-e2e/        Cypress E2E tests

libs/
├── article/            Article domain (CRUD, comments, favorites, tags)
│   ├── api/handlers/     REST controller
│   ├── api/shared/       Entities + services
│   ├── api-interfaces/   DTOs
│   ├── feature/          Angular components
│   └── shared/           Frontend services
│
├── user/               User domain (auth, profiles, follow)
│   ├── api/handlers/     REST controller
│   ├── api/shared/       Entities + services + JWT + guards
│   ├── api-interfaces/   DTOs
│   ├── feature/          Angular components
│   └── shared/           Frontend services + guards
│
└── shared/             Cross-cutting concerns
    ├── api/              Backend: config, core, foundation, error handler
    ├── client-server/    Shared interfaces (HTTP types, response contracts)
    └── (frontend)/       interceptors, foundation, storage, logging, etc.
```

### Data Flow

```
Browser → Angular (port 4200)
  → HTTP Interceptors (token, error, loading, caching, logging)
    → NestJS API (port 3000)
      → JwtAuthGuard (global)
        → Controller → Service → TypeORM Repository → MySQL
```

### Key Patterns
- **BaseEntity**: UUID PK, timestamps, soft delete — all entities extend this
- **BaseService<T>**: Generic CRUD via TypeORM Repository — all services extend this
- **Module-per-feature**: Each feature in its own NestJS/Angular module
- **Lazy loading**: Frontend features loaded on demand via Angular router

For detailed architecture documentation, see [docs/architecture.md](docs/architecture.md).

## Development Commands

```bash
# Serve
npm run serve:api              # Backend only (port 3000)
npm run serve:conduit          # Frontend only (port 4200)
npm run serve:api-conduit      # Both concurrently

# Build
npm run build-prod:api         # Production API build
npm run build-prod:conduit     # Production frontend build

# Test
npm test                       # Run unit tests
npm run e2e                    # Run Cypress E2E tests

# Code Quality
npm run lint                   # ESLint
npx nx format:write            # Prettier auto-format

# Database
npm run migration:run          # Execute TypeORM migrations

# Nx Utilities
npx nx dep-graph               # Visualize dependency graph
npx nx affected:test           # Test only affected projects
```

## API Documentation

Full API endpoint documentation: [docs/api.md](docs/api.md)

### Quick Reference

| Domain | Endpoints |
|--------|-----------|
| Auth | `POST /users/login`, `POST /users` |
| User | `GET /user`, `PUT /users` |
| Profiles | `GET /profiles/:username`, `POST/DELETE .../follow` |
| Articles | `GET/POST /articles`, `GET/PUT/DELETE /articles/:slug` |
| Feed | `GET /articles/feed` |
| Comments | `GET/POST /articles/:slug/comments`, `DELETE .../comments/:id` |
| Favorites | `POST/DELETE /articles/:slug/favorite` |
| Tags | `GET /tags` |

## Functionality Overview

Social blogging site (Medium.com clone) called "Conduit":

- **Authentication**: JWT-based (login/signup + token in localStorage)
- **Articles**: Create, read, update, delete with markdown support
- **Comments**: Create and delete on articles
- **Tags**: Filter articles by tag
- **Favorites**: Favorite/unfavorite articles
- **Profiles**: Follow/unfollow users, view authored/favorited articles
- **Feed**: Personalized feed from followed authors

### Pages
| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Article feed (global/personal/tag), tag cloud |
| Login | `/login` | Email + password login |
| Register | `/register` | New user registration |
| Settings | `/settings` | Edit profile and password |
| Editor | `/editor`, `/editor/:slug` | Create/edit article |
| Article | `/article/:slug` | Article view + comments |
| Profile | `/profile/:username` | User profile + article tabs |

## Project Structure

### Library Organization

Libraries are organized by **scope** and **type**:

| Scope | Description | Example |
|-------|-------------|---------|
| `domain` | Domain-specific code | `article/*`, `user/*` |
| `shared` | Reusable cross-cutting code | `shared/*` |

| Type | Description | Example |
|------|-------------|---------|
| `feature` | Smart components, controllers, lazy modules | `*-handlers`, `*-feature` |
| `lib` | Pure logic, services, interfaces | `*-shared`, `*-interfaces` |

### Import Convention

All libraries use `@realworld/*` scoped imports:
```typescript
import { UserService } from '@realworld/user/api/shared';
import { SharedCoreModule } from '@realworld/shared/core';
```

Path aliases are defined in `tsconfig.base.json`.

## AI-Assisted Development

This project is configured for AI-driven development (vibe coding):

- **CLAUDE.md** — AI agent instructions and project context
- **AGENTS.md** — Per-directory context files for AI agents
- **OpenSpec** — Spec-driven workflow (`../openspec/`)

See [CLAUDE.md](CLAUDE.md) for AI agent guidelines.
