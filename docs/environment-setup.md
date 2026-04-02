# Environment Setup

## Prerequisites

- Node.js 20 LTS
- npm 10.x
- PostgreSQL 16.x (or Docker)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hr-management-system
```

### 2. Install Node.js

Use nvm to install Node.js 20:

```bash
nvm install 20
nvm use 20
```

Or download from [nodejs.org](https://nodejs.org/)

### 3. Install Dependencies

From the root directory:

```bash
npm ci
```

This will install all dependencies for both frontend and backend using npm workspaces.

### 4. Database Setup

#### Option A: Local PostgreSQL

1. Install PostgreSQL 16.x
2. Create a database named `hr_management`
3. Update `.env` file with your database credentials

#### Option B: Docker

```bash
docker run -d \
  --name hr_management_db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=hr_management \
  -p 5432:5432 \
  postgres:16-alpine
```

### 5. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the values in `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/hr_management"
PORT=5000
NODE_ENV=development
VITE_API_URL=http://localhost:5000
```

### 6. Generate Prisma Client

```bash
cd backend
npx prisma generate
```

### 7. Run Database Migrations

```bash
cd backend
npx prisma migrate dev
```

### 8. Start Development Servers

From the root directory:

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Docker Development Setup

### 1. Start All Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Backend API
- Frontend UI

### 2. View Logs

```bash
docker-compose logs -f
```

### 3. Stop Services

```bash
docker-compose down
```

## Verification

### Backend Health Check

```bash
curl http://localhost:5000/health
```

### Frontend

Open http://localhost:3000 in your browser.

## Troubleshooting

### Port Already in Use

Change the port in `.env`:

```
PORT=5001
```

### Database Connection Failed

1. Check PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Check database credentials

### Prisma Client Error

```bash
cd backend
npx prisma generate
```

### Node Modules Issues

Delete node_modules and reinstall:

```bash
rm -rf node_modules frontend/node_modules backend/node_modules
npm ci
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run build` | Build both applications |
| `npm run lint` | Lint frontend and backend |
| `npm run test` | Run tests for both |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:generate` | Generate Prisma client |
