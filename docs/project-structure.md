# Project Structure

```
hr-management-system/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # CI/CD pipeline
├── .gitignore                  # Git ignore rules
├── .nvmrc                      # Node.js version (20 LTS)
├── .env.example                # Environment variables template
├── package.json                # Root package.json with workspaces
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   └── Button.jsx
│   │   ├── store/            # Redux store configuration
│   │   │   ├── index.js
│   │   │   ├── hooks.js
│   │   │   └── slices/
│   │   │       ├── appSlice.js
│   │   │       └── authSlice.js
│   │   ├── services/         # API service layer
│   │   │   └── api.js
│   │   ├── styles/           # Global styles
│   │   │   └── globals.css
│   │   ├── utils/            # Utility functions
│   │   │   └── helpers.js
│   │   ├── App.jsx           # Main App component
│   │   └── main.jsx          # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Express backend application
│   ├── prisma/
│   │   ├── schema.prisma    # Prisma schema
│   │   └── migrations/      # Database migrations
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   │   └── userController.js
│   │   ├── services/       # Business logic layer
│   │   │   └── userService.js
│   │   ├── lib/            # Library files
│   │   │   └── prisma.js   # Prisma client singleton
│   │   ├── routes/         # Express routes
│   │   │   └── userRoutes.js
│   │   └── index.js        # Express app entry point
│   └── package.json
├── docker/
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   └── docker-compose.yml
└── docs/
    ├── project-structure.md
    ├── coding-standards.md
    ├── git-workflow.md
    ├── environment-setup.md
    └── scaling-guidelines.md
```

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, Redux Toolkit
- **Backend**: Express.js, Node.js (ES Modules)
- **Database**: PostgreSQL, Prisma ORM
- **Package Manager**: npm
- **State Management**: Redux Toolkit

## Directory Purposes

- **frontend/src/components**: Reusable UI components
- **frontend/src/store**: Redux store and slices
- **frontend/src/services**: API client and service functions
- **frontend/src/utils**: Helper functions and utilities
- **backend/src/controllers**: Request handlers (thin controllers)
- **backend/src/services**: Business logic (all DB access here)
- **backend/src/lib**: Library files (Prisma client)
- **backend/prisma**: Database schema and migrations
