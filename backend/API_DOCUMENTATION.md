# Time Tracker API Documentation

This document provides comprehensive documentation for the Time Tracker API, which has been enhanced with Swagger/OpenAPI documentation.

## Overview

The Time Tracker API is a RESTful API built with Fastify and TypeScript that provides endpoints for managing projects, tasks, and time tracking. The API includes comprehensive Swagger documentation accessible at `/docs`.

## Base URL

- Development: `http://localhost:3001`
- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs/json`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST `/api/auth/login`
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### GET `/api/auth/me`
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Projects (`/api`)

#### GET `/api/projects`
Get all projects for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "projects": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "My Project",
      "description": "Project description",
      "color": "#3B82F6",
      "userId": "507f1f77bcf86cd799439012",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/api/projects`
Create a new project.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "My Project",
  "description": "Project description",
  "color": "#3B82F6"
}
```

**Response (201):**
```json
{
  "message": "Project created successfully",
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Project",
    "description": "Project description",
    "color": "#3B82F6",
    "userId": "507f1f77bcf86cd799439012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET `/api/projects/:id`
Get a specific project by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Project",
    "description": "Project description",
    "color": "#3B82F6",
    "userId": "507f1f77bcf86cd799439012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT `/api/projects/:id`
Update a project.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Project",
  "description": "Updated description",
  "color": "#EF4444"
}
```

**Response (200):**
```json
{
  "message": "Project updated successfully",
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Project",
    "description": "Updated description",
    "color": "#EF4444",
    "userId": "507f1f77bcf86cd799439012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### DELETE `/api/projects/:id`
Delete a project and all associated tasks and time entries.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Project deleted successfully"
}
```

### Tasks (`/api`)

#### GET `/api/tasks`
Get all tasks for the authenticated user, optionally filtered by project.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `projectId` (optional): Filter tasks by project ID

**Response (200):**
```json
{
  "tasks": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "My Task",
      "description": "Task description",
      "projectId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "My Project",
        "color": "#3B82F6"
      },
      "userId": "507f1f77bcf86cd799439013",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/api/tasks`
Create a new task.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "My Task",
  "description": "Task description",
  "projectId": "507f1f77bcf86cd799439012"
}
```

**Response (201):**
```json
{
  "message": "Task created successfully",
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Task",
    "description": "Task description",
    "projectId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "My Project",
      "color": "#3B82F6"
    },
    "userId": "507f1f77bcf86cd799439013",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET `/api/tasks/:id`
Get a specific task by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Task",
    "description": "Task description",
    "projectId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "My Project",
      "color": "#3B82F6"
    },
    "userId": "507f1f77bcf86cd799439013",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT `/api/tasks/:id`
Update a task.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Task",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "message": "Task updated successfully",
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Task",
    "description": "Updated description",
    "projectId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "My Project",
      "color": "#3B82F6"
    },
    "userId": "507f1f77bcf86cd799439013",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### DELETE `/api/tasks/:id`
Delete a task and all associated time entries.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

### Time Entries (`/api`)

#### POST `/api/time-entries/start`
Start a timer for a specific task.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "taskId": "507f1f77bcf86cd799439011",
  "description": "Working on feature"
}
```

**Response (201):**
```json
{
  "message": "Timer started successfully",
  "timeEntry": {
    "_id": "507f1f77bcf86cd799439011",
    "taskId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "My Task",
      "projectId": "507f1f77bcf86cd799439013"
    },
    "userId": "507f1f77bcf86cd799439014",
    "startTime": "2024-01-01T09:00:00.000Z",
    "description": "Working on feature",
    "createdAt": "2024-01-01T09:00:00.000Z",
    "updatedAt": "2024-01-01T09:00:00.000Z"
  }
}
```

#### POST `/api/time-entries/stop`
Stop the currently active timer.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "description": "Finished working"
}
```

**Response (200):**
```json
{
  "message": "Timer stopped successfully",
  "timeEntry": {
    "_id": "507f1f77bcf86cd799439011",
    "taskId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "My Task",
      "projectId": "507f1f77bcf86cd799439013"
    },
    "userId": "507f1f77bcf86cd799439014",
    "startTime": "2024-01-01T09:00:00.000Z",
    "endTime": "2024-01-01T17:00:00.000Z",
    "description": "Finished working",
    "createdAt": "2024-01-01T09:00:00.000Z",
    "updatedAt": "2024-01-01T17:00:00.000Z"
  }
}
```

#### GET `/api/time-entries/active`
Get the currently active timer.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "timeEntry": {
    "_id": "507f1f77bcf86cd799439011",
    "taskId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "My Task",
      "projectId": "507f1f77bcf86cd799439013"
    },
    "userId": "507f1f77bcf86cd799439014",
    "startTime": "2024-01-01T09:00:00.000Z",
    "description": "Working on feature",
    "createdAt": "2024-01-01T09:00:00.000Z",
    "updatedAt": "2024-01-01T09:00:00.000Z"
  }
}
```

#### GET `/api/time-entries`
Get time entries with optional filters.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `projectId` (optional): Filter by project ID
- `taskId` (optional): Filter by task ID
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)
- `limit` (optional): Number of entries to return (default: 50)
- `offset` (optional): Number of entries to skip (default: 0)

**Response (200):**
```json
{
  "timeEntries": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "taskId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "My Task",
        "projectId": "507f1f77bcf86cd799439013"
      },
      "userId": "507f1f77bcf86cd799439014",
      "startTime": "2024-01-01T09:00:00.000Z",
      "endTime": "2024-01-01T17:00:00.000Z",
      "description": "Working on feature",
      "createdAt": "2024-01-01T09:00:00.000Z",
      "updatedAt": "2024-01-01T17:00:00.000Z"
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

#### PUT `/api/time-entries/:id`
Update a time entry.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "startTime": "2024-01-01T09:00:00Z",
  "endTime": "2024-01-01T17:00:00Z",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "message": "Time entry updated successfully",
  "timeEntry": {
    "_id": "507f1f77bcf86cd799439011",
    "taskId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "My Task",
      "projectId": "507f1f77bcf86cd799439013"
    },
    "userId": "507f1f77bcf86cd799439014",
    "startTime": "2024-01-01T09:00:00.000Z",
    "endTime": "2024-01-01T17:00:00.000Z",
    "description": "Updated description",
    "createdAt": "2024-01-01T09:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### DELETE `/api/time-entries/:id`
Delete a time entry.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Time entry deleted successfully"
}
```

### Health Check

#### GET `/health`
Health check endpoint to verify server and database status.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "environment": "development"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

## Swagger Integration

The API includes comprehensive Swagger/OpenAPI documentation with the following features:

- **Interactive API Explorer**: Accessible at `/docs`
- **OpenAPI Specification**: Available at `/docs/json`
- **Request/Response Examples**: All endpoints include example requests and responses
- **Authentication Support**: JWT Bearer token authentication is documented
- **Schema Definitions**: Reusable schema definitions for all data models
- **Error Documentation**: Comprehensive error response documentation

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   Copy `env.example` to `.env` and configure your environment variables.

3. **Start the Server**:
   ```bash
   npm run dev
   ```

4. **Access Swagger Documentation**:
   Open your browser and navigate to `http://localhost:3001/docs`

5. **Test the API**:
   Use the Swagger UI to test endpoints interactively or use the provided examples above.

## Dependencies Added

The following packages were added to enable Swagger documentation:

- `@fastify/swagger`: Fastify plugin for OpenAPI/Swagger documentation
- `@fastify/swagger-ui`: Fastify plugin for Swagger UI interface

These packages provide a complete documentation solution that automatically generates interactive API documentation from your route schemas.
