<!-- ac0aa502-ce7d-4ca5-bc7b-19a8ab0ea712 c9355837-b7e3-4af9-9048-4039c61e123c -->
# Time Tracker App - Implementation Plan

## Project Structure

Create monorepo at `/Users/gilalvarado/Documents/personal/time-tracker/` with:

- `/frontend` - React + TypeScript + Vite + shadcn/ui + Tailwind
- `/backend` - Fastify + TypeScript + MongoDB + JWT auth
- `/docker` - Docker Compose configuration for production deployment
- Root-level configuration files

## Backend Implementation

### 1. Backend Setup & Configuration

- Initialize Fastify TypeScript project with proper folder structure
- Configure MongoDB connection (using Mongoose for ODM)
- Set up environment variables (.env file with DB connection, JWT secret, etc.)
- Configure CORS for frontend communication
- Add validation using Zod or Fastify's built-in validator

### 2. Database Models (Mongoose Schemas)

- **User**: `{ email, password (hashed), name, createdAt }`
- **Project**: `{ name, description, color, userId, createdAt, updatedAt }`
- **Task**: `{ name, description, projectId, userId, createdAt, updatedAt }`
- **TimeEntry**: `{ taskId, userId, startTime, endTime (nullable), duration, description, createdAt }`

### 3. Authentication Module

- `/auth/register` - User registration with bcrypt password hashing
- `/auth/login` - Login with JWT token generation
- `/auth/me` - Get current user (protected route)
- JWT middleware for route protection
- Token verification and refresh logic

### 4. API Routes (Protected)

- **Projects**: CRUD endpoints (`GET/POST /projects`, `GET/PUT/DELETE /projects/:id`)
- **Tasks**: CRUD endpoints with project association (`GET/POST /tasks`, `GET/PUT/DELETE /tasks/:id`)
- **Time Entries**: 
- `POST /time-entries/start` - Start timer for a task
- `POST /time-entries/stop` - Stop active timer
- `GET /time-entries/active` - Get currently running timer
- `GET /time-entries` - List all entries with filters (by project/task/date range)
- `PUT /time-entries/:id` - Update entry
- `DELETE /time-entries/:id` - Delete entry

## Frontend Implementation

### 5. Frontend Setup

- Initialize Vite + React + TypeScript project
- Configure Tailwind CSS
- Install and configure shadcn/ui components
- Set up React Router for navigation
- Configure Axios/Fetch for API calls with interceptors

### 6. Authentication & State Management

- Create auth context/provider for user state
- Implement protected routes
- Login/Register pages with form validation
- Store JWT in localStorage/sessionStorage
- Automatic token refresh handling

### 7. Core Pages & Components

- **Dashboard**: Overview with active timer, recent entries, quick stats
- **Projects Page**: List/grid view with create/edit/delete functionality
- **Project Detail**: View project with associated tasks and time entries
- **Tasks Page**: Task management within projects
- **Time Tracker Component**: 
- Live timer display with start/stop button
- Task selector dropdown
- Running time display (HH:MM:SS format)
- Visual indicator when timer is active
- **Time Entries Page**: Table/list view of all time entries with filters and export options

### 8. shadcn/ui Components to Use

- Button, Input, Label, Form components for forms
- Card, Table, Dialog, Select, Dropdown Menu
- Toast notifications for success/error messages
- Badge for status indicators
- Calendar/Date picker for date filtering

## Docker & Deployment

### 9. Docker Configuration

- `Dockerfile` for backend (Node.js multi-stage build)
- `Dockerfile` for frontend (Nginx to serve static files)
- `docker-compose.yml` with services:
- MongoDB container
- Backend API container
- Frontend container
- Nginx reverse proxy
- Environment variable management for production
- Volume configuration for MongoDB data persistence

### 10. Additional Configuration

- `.dockerignore` files
- Production environment variables template
- README with setup and deployment instructions
- Health check endpoints for containers

## Key Features

- JWT-based authentication with secure password hashing
- Real-time timer with accurate duration tracking
- Hierarchical structure: Projects → Tasks → Time Entries
- Responsive UI that works on desktop and mobile
- MongoDB free tier compatible (MongoDB Atlas)
- One-command Docker deployment

### To-dos

- [ ] Initialize backend with Fastify, TypeScript, and MongoDB setup
- [ ] Implement authentication module with JWT and bcrypt
- [ ] Create Mongoose schemas for User, Project, Task, and TimeEntry
- [ ] Build CRUD API routes for projects, tasks, and time entries
- [ ] Initialize frontend with React, Vite, Tailwind, and shadcn/ui
- [ ] Implement frontend authentication with protected routes
- [ ] Build core UI components and pages (dashboard, projects, tasks, timer)
- [ ] Implement live timer functionality with start/stop actions
- [ ] Create Docker configuration for production deployment