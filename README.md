# Time Tracker Application

A full-stack time tracking application built with React, Fastify, MongoDB, and Docker.

## Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Project Management**: Create and manage projects with custom colors
- **Task Management**: Organize tasks within projects
- **Time Tracking**: Start/stop timer functionality with real-time tracking
- **Time Entries**: View, edit, and export time entries with filtering
- **Responsive Design**: Works on desktop and mobile devices
- **Docker Support**: Easy deployment with Docker Compose

## Tech Stack

### Backend
- **Fastify**: High-performance Node.js web framework
- **TypeScript**: Type-safe JavaScript
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **Zod**: Schema validation

### Frontend
- **React**: UI library with TypeScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **TanStack Query**: Server state management
- **Zustand**: Client state management
- **React Router**: Client-side routing
- **React Hook Form**: Form handling with validation

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and static file serving

## Project Structure

```
time-tracker/
├── backend/                 # Fastify API server
│   ├── src/
│   │   ├── config/         # Database and environment config
│   │   ├── middleware/     # Authentication middleware
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   ├── server.ts       # Fastify server setup
│   │   └── index.ts        # Entry point
│   ├── Dockerfile          # Production Docker image
│   ├── Dockerfile.dev      # Development Docker image
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores
│   │   └── App.tsx         # Main app component
│   ├── Dockerfile          # Production Docker image
│   ├── Dockerfile.dev      # Development Docker image
│   └── package.json
├── docker/                 # Docker Compose files
│   ├── docker-compose.yml  # Production setup
│   └── docker-compose.dev.yml # Development setup
└── README.md
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd time-tracker
   ```

2. **Start development environment**
   ```bash
   cd docker
   docker-compose -f docker-compose.dev.yml up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - MongoDB: localhost:27017

### Production Deployment

1. **Configure environment variables**
   ```bash
   # Copy and edit environment files
   cp backend/env.example backend/.env
   cp frontend/env.example frontend/.env.local
   ```

2. **Deploy with Docker Compose**
   ```bash
   cd docker
   docker-compose up --build -d
   ```

3. **Access the application**
   - Application: http://localhost
   - Backend API: http://localhost:3001

## Local Development (Without Docker)

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB connection string
   ```

3. **Start MongoDB** (local installation or MongoDB Atlas)

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your API URL
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - List tasks (with optional project filter)
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Time Entries
- `POST /api/time-entries/start` - Start timer
- `POST /api/time-entries/stop` - Stop timer
- `GET /api/time-entries/active` - Get active timer
- `GET /api/time-entries` - List time entries (with filters)
- `PUT /api/time-entries/:id` - Update time entry
- `DELETE /api/time-entries/:id` - Delete time entry

## Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/time-tracker
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=900000
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Time Tracker
```

## Database Schema

### User
- `email` (unique)
- `password` (hashed)
- `name`
- `createdAt`

### Project
- `name`
- `description`
- `color`
- `userId` (reference)
- `createdAt`, `updatedAt`

### Task
- `name`
- `description`
- `projectId` (reference)
- `userId` (reference)
- `createdAt`, `updatedAt`

### TimeEntry
- `taskId` (reference)
- `userId` (reference)
- `startTime`
- `endTime` (nullable)
- `duration` (calculated)
- `description`
- `createdAt`, `updatedAt`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
