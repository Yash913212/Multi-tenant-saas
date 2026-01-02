# Multi-Tenant SaaS Platform

A production-ready multi-tenant project and task management SaaS platform with complete tenant isolation, role-based access control, subscription plan limits, audit logging, and comprehensive Dockerization.

## 🎯 Features

- **Multi-Tenancy**: Complete data isolation with tenant-scoped queries and middleware enforcement
- **Authentication & Authorization**: JWT-based auth with role-based access control (super_admin, tenant_admin, user)
- **Subscription Plans**: Free, Pro, and Enterprise tiers with enforced user/project limits
- **Project & Task Management**: Full CRUD operations with status tracking and assignment
- **Audit Logging**: Comprehensive logging of all critical operations
- **Dockerized**: One-command deployment with docker-compose
- **RESTful API**: 19+ well-documented endpoints with consistent error handling
- **Modern Frontend**: React SPA with protected routes and role-aware UI

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js 20, Express.js, Knex.js, PostgreSQL 15
- **Frontend**: React 18, Vite 5, React Router 6, Axios
- **Infrastructure**: Docker Compose, PostgreSQL Alpine, Node Alpine images

### System Architecture
```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   React     │────▶│  Express    │────▶│  PostgreSQL  │
│  Frontend   │◀────│   Backend   │◀────│   Database   │
│  (Port 3000)│     │ (Port 5000) │     │  (Port 5432) │
└─────────────┘     └─────────────┘     └──────────────┘
```

See [docs/images/system-architecture.txt](docs/images/system-architecture.txt) for detailed architecture diagram.

### Database Schema
See [docs/images/database-erd.txt](docs/images/database-erd.txt) for complete Entity Relationship Diagram.

**Core Tables**:
- `tenants` - Multi-tenant organizations
- `users` - Users with role-based access
- `projects` - Tenant-scoped projects
- `tasks` - Project tasks with assignments
- `audit_logs` - Audit trail for compliance

## 🚀 Quick Start (Docker - Recommended)

### Prerequisites
- Docker 24+ and Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone <your-repository-url>
cd Multi-tenant-sass-platform
```

2. **Start all services with one command**
```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database on port 5432
- Run database migrations automatically
- Load seed data automatically
- Start backend API on port 5000
- Start frontend app on port 3000

3. **Verify services are running**
```bash
docker-compose ps
```

Expected output:
```
NAME                                 STATUS
multi-tenant-sass-platform-database-1   running (healthy)
multi-tenant-sass-platform-backend-1    running (healthy)
multi-tenant-sass-platform-frontend-1   running
```

4. **Access the application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### Test Credentials

Seed data includes the following accounts (passwords documented in [submission.json](submission.json)):

**Super Admin** (global access):
- Email: `superadmin@system.com`
- Password: `Admin@123`

**Demo Tenant Admin**:
- Email: `admin@demo.com`
- Password: `Demo@123`
- Subdomain: `demo`

**Demo Users**:
- Email: `user1@demo.com` / Password: `User@123`
- Email: `user2@demo.com` / Password: `User@123`

### Stopping Services
```bash
docker-compose down
```

To remove volumes (deletes database data):
```bash
docker-compose down -v
```

## 📚 Documentation

### Core Documentation
- **[API Documentation](docs/api.md)** - Complete API reference for all 19+ endpoints
- **[Architecture](docs/architecture.md)** - System design, database ERD, endpoint list
- **[Technical Specification](docs/technical-spec.md)** - Project structure and setup guide
- **[Product Requirements](docs/PRD.md)** - User personas, functional requirements (15+), non-functional requirements (5+)
- **[Research Document](docs/research.md)** - Multi-tenancy analysis (1700+ words), technology stack justification, security considerations

### Diagrams
- **[System Architecture Diagram](docs/images/system-architecture.txt)** - High-level component architecture
- **[Database ERD](docs/images/database-erd.txt)** - Complete entity relationship diagram with all tables, relationships, and constraints

## 🔒 Security Features

- ✅ **Password Hashing**: bcrypt with 10 salt rounds
- ✅ **JWT Authentication**: Signed tokens with 24-hour expiry
- ✅ **SQL Injection Prevention**: Parameterized queries via Knex
- ✅ **XSS Protection**: React's built-in escaping + Helmet.js security headers
- ✅ **CORS**: Restricted to frontend origin
- ✅ **Tenant Isolation**: Middleware-enforced data separation
- ✅ **Audit Logging**: All critical operations logged with user/tenant context
- ✅ **Role-Based Access Control**: Three-tier RBAC (super_admin, tenant_admin, user)

## 🛠️ Development Setup (Without Docker)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
Requires PostgreSQL 15+ running locally. Configure `DATABASE_URL` in `.env` file.

**Run migrations and seeds**:
```bash
cd backend
npm run migrate
npm run seed
```

## 📁 Project Structure

```
Multi-tenant-sass-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, RBAC, tenant isolation
│   │   ├── routes/            # API routes
│   │   ├── config/            # Database & app config
│   │   └── utils/             # Helper functions
│   ├── migrations/            # Knex database migrations
│   ├── seeds/                 # Seed data (auto-loaded)
│   ├── Dockerfile             # Backend container definition
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/             # React pages/views
│   │   ├── components/        # Reusable React components
│   │   ├── context/           # Auth context (JWT management)
│   │   └── services/          # API client (Axios)
│   ├── Dockerfile             # Frontend container definition
│   └── package.json
├── docs/
│   ├── api.md                 # API documentation
│   ├── architecture.md        # System architecture
│   ├── PRD.md                 # Product requirements
│   ├── research.md            # Technical research
│   ├── technical-spec.md      # Technical specification
│   └── images/                # Architecture diagrams
├── docker-compose.yml         # Multi-service orchestration
├── .env                       # Environment variables (dev)
├── submission.json            # Test credentials for evaluation
└── README.md                  # This file
```

## 🔗 API Endpoints

**Authentication** (Public):
- `POST /api/auth/register-tenant` - Register new tenant
- `POST /api/auth/login` - User login

**Health Check** (Public):
- `GET /api/health` - API and database status

**Tenants** (super_admin):
- `GET /api/tenants` - List all tenants
- `GET /api/tenants/:id` - Get tenant details with stats
- `PATCH /api/tenants/:id` - Update tenant (status, plan)

**Users** (authenticated):
- `POST /api/users` - Create user (tenant_admin+)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user (tenant_admin+)
- `DELETE /api/users/:id` - Delete user (tenant_admin+)
- `GET /api/tenants/:id/users` - List tenant users

**Projects** (authenticated):
- `POST /api/projects` - Create project (tenant_admin)
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project (tenant_admin)
- `DELETE /api/projects/:id` - Delete project (tenant_admin)

**Tasks** (authenticated):
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/projects/:projectId/tasks` - List tasks
- `PATCH /api/projects/:projectId/tasks/:id` - Update task
- `DELETE /api/projects/:projectId/tasks/:id` - Delete task (tenant_admin)

See [docs/api.md](docs/api.md) for complete request/response examples.

## 🎬 Demo Video

**YouTube Link**: [Demo Video](https://youtu.be/YOUR_VIDEO_ID)

**Video Contents** (5-12 minutes):
1. Introduction & architecture overview
2. Docker deployment demonstration
3. Multi-tenancy demonstration (tenant isolation)
4. User registration and login
5. Project and task management
6. Role-based access control demonstration
7. Code walkthrough (key components)

## 🧪 Testing

### Manual Testing
1. Start services: `docker-compose up -d`
2. Open frontend: http://localhost:3000
3. Login with test credentials (see above)
4. Test tenant isolation by creating second tenant
5. Verify role-based UI (admin vs user views)

### API Testing
```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@123","subdomain":"demo"}'

# List projects (replace TOKEN)
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Subscription Plans

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Max Users | 5 | 25 | 100 |
| Max Projects | 3 | 15 | 50 |
| Support | Community | Email | Priority |

Plan limits are enforced at the service layer before user/project creation.

## 🚦 Environment Variables

All required environment variables are in the `.env` file (committed for development/evaluation).

**Key Variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `JWT_EXPIRES_IN` - Token expiration (default: 24h)
- `PORT` - Backend port (5000)
- `FRONTEND_URL` - CORS origin (http://localhost:3000)
- `VITE_API_BASE_URL` - Frontend API endpoint

## 🐛 Troubleshooting

### Services won't start
```bash
# Check service logs
docker-compose logs backend
docker-compose logs database
docker-compose logs frontend

# Restart services
docker-compose restart
```

### Database migration issues
```bash
# Access backend container
docker-compose exec backend sh

# Manually run migrations
npm run migrate

# Check migration status
npm run migrate:status
```

### Frontend can't connect to backend
1. Verify backend is running: `docker-compose ps backend`
2. Check backend health: `curl http://localhost:5000/api/health`
3. Verify CORS settings in backend `.env`
4. Check browser console for errors

### Port conflicts
If ports 3000, 5000, or 5432 are already in use, stop conflicting services or modify port mappings in `docker-compose.yml`.

## 🤝 Contributing

This is a demonstration project for evaluation. For production use, consider:
- Adding comprehensive test coverage (Jest, Supertest)
- Implementing refresh token pattern
- Adding rate limiting
- Integrating input validation library (Joi)
- Setting up CI/CD pipeline
- Adding monitoring and alerting (Prometheus, Grafana)
- Implementing caching layer (Redis)

## 📝 License

This project is created for educational and evaluation purposes.

## 📧 Contact

For questions or issues, please refer to the documentation or create an issue in the repository.

---

**Evaluation Ready**: ✅ Docker containerization | ✅ Automatic migrations/seeds | ✅ 19+ API endpoints | ✅ Complete documentation | ✅ Test credentials in submission.json
