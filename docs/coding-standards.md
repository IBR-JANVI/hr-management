# Coding Standards

## Overview

This document outlines the coding standards and best practices for the HR Management System project. All developers and AI agents must follow these guidelines to ensure consistency and maintainability.

## Language and Framework Versions

- **Node.js**: 20 LTS
- **npm**: 10.x
- **React**: 18.x
- **Express**: 4.x
- **PostgreSQL**: 16.x
- **Prisma**: 5.x

## Module System

- Use ES Modules (`"type": "module"`) for both frontend and backend
- Use `.js` extension for JavaScript files
- Use `.jsx` extension for React components
- Always use explicit file extensions in imports

## Naming Conventions

### Files
- Use kebab-case for file names: `userService.js`, `authSlice.js`
- Use PascalCase for React components: `Button.jsx`, `UserCard.jsx`

### Variables and Functions
- Use camelCase: `getUsers()`, `userData`
- Use UPPER_SNAKE_CASE for constants: `API_URL`, `MAX_RETRY_COUNT`

### Classes
- Use PascalCase: `ApiError`, `UserService`

## Code Style

### General
- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons at the end of statements
- Maximum line length: 100 characters

### Frontend (React)
- Use functional components with hooks
- Prefer arrow functions for callbacks
- Destructure props for better readability
- Keep components small and focused

### Backend (Express)
- Use async/await for asynchronous operations
- Keep controllers thin (no business logic)
- All business logic in services layer
- Use proper error handling with try/catch

## State Management (Redux Toolkit)

### Store Structure
- Use feature-based slices
- Keep global state minimal
- Use selectors for derived data

### Example Slice Structure
```javascript
const slice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    action: (state, action) => {
      // immutable updates
    },
  },
});
```

## API Design

### Response Format
All API responses must follow this format:
```javascript
{
  success: true,
  data: {},
  error: null
}
```

### Error Handling
- Use appropriate HTTP status codes
- Return consistent error format
- Log errors server-side

## Database Access

### Prisma Rules
- NEVER instantiate PrismaClient directly in services
- ALWAYS use the singleton from `backend/src/lib/prisma.js`
- All database operations MUST go through service layer
- Use Prisma queries - never raw SQL

## Validation

- Use Joi for backend request validation
- Validate on controller level
- Return structured validation errors

## Security

- Never expose sensitive data in responses
- Use environment variables for secrets
- Sanitize user inputs
- Use parameterized queries (Prisma handles this)

## Testing

- Write tests for all services and utilities
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

## File Organization

```
src/
├── components/     # UI components
├── services/       # API and business logic
├── store/          # Redux state
├── utils/         # Helper functions
└── styles/        # CSS and styling
```

## Import Aliases

The following aliases are configured:
- `@` → `frontend/src`
- `@components` → `frontend/src/components`
- `@utils` → `frontend/src/utils`
- `@store` → `frontend/src/store`
- `@services` → `frontend/src/services`

## Prohibited Practices

1. **NO** raw SQL queries - use Prisma
2. **NO** business logic in controllers
3. **NO** database access in components
4. **NO** multiple PrismaClient instances
5. **NO** mixing state management solutions
6. **NO** inline styles - use Tailwind CSS
7. **NO** API calls directly in components
