# Deployment Guide

## Prerequisites

- Docker Desktop 4.0 or higher
- Docker Compose V2
- At least 2GB RAM available
- Ports 3000, 5000, and 5432 available

## Quick Deployment

```bash
docker-compose up -d
```

This single command will:
1. Create and start PostgreSQL 15 container
2. Build and start Node.js 20 backend container
3. Build and start React 18 frontend container
4. Run database migrations automatically
5. Seed initial data (demo tenant + users)

## Verification

Check all services are running:
```bash
docker-compose ps
```

Expected output:
```
NAME       STATUS
database   Up (healthy)
backend    Up (healthy)
frontend   Up
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432 (postgres/postgres)

## Test Credentials

See `submission.json` for complete test credentials.

**Tenant Admin:**
- Email: admin@demo.com
- Password: Demo@123
- Tenant Subdomain: demo

## Health Checks

Backend health endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Health check",
  "data": {
    "api": "ok",
    "database": "connected"
  }
}
```

## Troubleshooting

### Port Conflicts

If ports are in use:
```bash
# Windows
netstat -ano | findstr ":5000"
Stop-Process -Id <PID> -Force

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Container Issues

View logs:
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

Rebuild containers:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Reset

To reset database and reseed:
```bash
docker-compose down -v
docker-compose up -d
```

## Production Considerations

For production deployment:

1. **Environment Variables**: Use proper secrets management
2. **SSL/TLS**: Configure HTTPS with Let's Encrypt
3. **Database**: Use managed PostgreSQL service
4. **Scaling**: Use orchestration (Kubernetes/ECS)
5. **Monitoring**: Add APM tools (DataDog, New Relic)
6. **Backup**: Implement automated database backups

## Architecture

See `docs/images/system-architecture.txt` for complete architecture diagram.

## Security

- JWT tokens expire after 24 hours
- Passwords hashed with bcrypt (10 rounds)
- Helmet.js security headers enabled
- CORS configured for known origins
- SQL injection prevention via parameterized queries
