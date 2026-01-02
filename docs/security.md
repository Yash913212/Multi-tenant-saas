# Security Documentation

## Overview

This document outlines the security measures implemented in the Multi-Tenant SaaS Platform.

## Authentication & Authorization

### JWT Token-Based Authentication

- **Algorithm**: HS256 (HMAC with SHA-256)
- **Token Expiration**: 24 hours
- **Storage**: LocalStorage (frontend), validated on every request (backend)
- **Secret Key**: Environment variable `JWT_SECRET` (must be rotated in production)

**Token Payload:**
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "role": "tenant_admin",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Password Security

- **Hashing Algorithm**: bcrypt
- **Salt Rounds**: 10
- **Minimum Requirements**: 
  - 8 characters minimum
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### Role-Based Access Control (RBAC)

Three distinct roles with hierarchical permissions:

#### Super Admin
- System-wide access across all tenants
- Can create new tenants
- Can manage users in any tenant
- Can view system-wide audit logs
- Cannot be created through regular registration

#### Tenant Admin
- Full access within their tenant only
- Can create/edit/delete projects
- Can create/edit/delete users within tenant
- Can assign tasks and manage team
- Can view tenant-specific audit logs
- Created during tenant registration

#### User
- Read-only access to assigned projects
- Can create/edit tasks in assigned projects
- Can update own task assignments
- Can edit own profile only
- No administrative capabilities

## Tenant Isolation

### Database-Level Isolation

Every multi-tenant table includes `tenant_id` column:

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  -- other columns
);
```

### Query-Level Isolation

All database queries automatically filter by tenant:

```javascript
const projects = await db('projects')
  .where({ tenant_id: user.tenantId })
  .select('*');
```

### Middleware Enforcement

Tenant context extracted from JWT token and enforced in middleware:

```javascript
function extractTenant(req, res, next) {
  const { tenantId } = req.user; // from JWT
  req.tenantId = tenantId;
  next();
}
```

### Super Admin Override

Super admins can specify target tenant via request body or query parameter:

```javascript
const targetTenant = req.query.tenantId || req.user.tenantId;
```

## Cross-Site Scripting (XSS) Prevention

### Backend
- **Helmet.js**: Security headers including CSP, X-XSS-Protection
- **Content Security Policy**: 
  ```
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  ```

### Frontend
- **React Default Escaping**: All user input automatically escaped
- **DOMPurify**: Sanitizes any HTML input (if needed)
- **No dangerouslySetInnerHTML**: Avoided throughout codebase

## Cross-Site Request Forgery (CSRF) Protection

- **SameSite Cookies**: Not applicable (JWT in headers, not cookies)
- **CORS Configuration**: Whitelist of allowed origins
- **Custom Headers**: Authorization header required for mutations

## SQL Injection Prevention

### Parameterized Queries

All queries use Knex.js parameterization:

```javascript
// SAFE - parameterized
await db('users')
  .where({ email: userInput })
  .first();

// UNSAFE - never used
await db.raw(`SELECT * FROM users WHERE email = '${userInput}'`);
```

### Input Validation

- **Email validation**: Regex pattern check
- **UUID validation**: Format verification
- **String sanitization**: Trim and length limits

## CORS (Cross-Origin Resource Sharing)

### Configuration

```javascript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://frontend:3000'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
```

### Allowed Methods
- GET, POST, PUT, PATCH, DELETE

### Allowed Headers
- Authorization, Content-Type

## Audit Logging

### Tracked Actions
- User creation/updates/deletion
- Project creation/updates/deletion
- Task creation/updates/deletion
- Tenant registration
- Login attempts (planned)

### Audit Log Schema

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Log Retention
- **Default**: Indefinite (production should implement rotation)
- **Recommendation**: 90 days for GDPR compliance

## Rate Limiting

### Implementation (Recommended for Production)

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### Specific Limits
- **Login endpoint**: 5 attempts per 15 minutes
- **Registration**: 3 tenants per IP per day
- **API endpoints**: 100 requests per 15 minutes

## Environment Variables

### Required Secrets

```env
# Database
DB_HOST=database
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres  # CHANGE IN PRODUCTION
DB_NAME=saas_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production  # ROTATE REGULARLY

# Application
NODE_ENV=production
PORT=5000

# Frontend
FRONTEND_URL=https://your-domain.com
```

### Secret Management

**Development:**
- `.env` file (gitignored)

**Production Recommendations:**
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Cloud Secret Manager

## HTTPS/TLS

### Production Setup

1. **Obtain SSL Certificate**
   ```bash
   # Using Let's Encrypt
   certbot certonly --standalone -d yourdomain.com
   ```

2. **Nginx Reverse Proxy**
   ```nginx
   server {
     listen 443 ssl;
     server_name yourdomain.com;
     
     ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
     
     location / {
       proxy_pass http://frontend:3000;
     }
     
     location /api/ {
       proxy_pass http://backend:5000;
     }
   }
   ```

## Database Security

### Connection Security
- **SSL/TLS**: Enable for production database connections
- **Connection Pooling**: Limit max connections per service
- **Timeout Configuration**: Prevent connection exhaustion

### Backup & Recovery
- **Automated Backups**: Daily full backups
- **Point-in-Time Recovery**: WAL archiving enabled
- **Backup Encryption**: AES-256 encryption at rest
- **Off-site Storage**: S3 or equivalent with versioning

### Access Control
- **Principle of Least Privilege**: Service accounts with minimal permissions
- **No Root Access**: Dedicated service users
- **Network Isolation**: Database not exposed to public internet

## Dependency Security

### Vulnerability Scanning

```bash
# npm audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

### Automated Updates
- **Dependabot**: GitHub automated security updates
- **Snyk**: Continuous vulnerability monitoring
- **npm-check-updates**: Keep dependencies current

## Docker Security

### Best Practices Implemented

1. **Non-Root User**: Containers run as node user (UID 1000)
2. **Minimal Base Images**: Alpine Linux (5MB base)
3. **Multi-Stage Builds**: Reduce attack surface
4. **No Secrets in Images**: Environment variables only
5. **Read-Only Filesystem**: Where possible

### Scanning Images

```bash
# Scan for vulnerabilities
docker scan multi-tenant-sass-platform-backend
docker scan multi-tenant-sass-platform-frontend
```

## Compliance Considerations

### GDPR (General Data Protection Regulation)

- **Data Minimization**: Only collect necessary information
- **Right to Erasure**: User deletion cascades to related data
- **Data Portability**: API endpoints for data export
- **Audit Trail**: All data access logged
- **Consent**: Terms of service acceptance required

### SOC 2 Type II

- **Access Controls**: Role-based access enforced
- **Change Management**: Git version control with audit trail
- **Incident Response**: Logging and monitoring in place
- **Encryption**: Data in transit (HTTPS) and at rest (database)

## Incident Response Plan

### Detection
1. Monitor application logs for errors
2. Set up alerts for failed login attempts
3. Track API rate limit violations
4. Monitor database for unusual queries

### Response
1. **Isolate**: Stop affected services
2. **Investigate**: Review logs and audit trail
3. **Contain**: Rotate compromised credentials
4. **Recover**: Restore from backup if needed
5. **Document**: Record incident details
6. **Improve**: Update security measures

### Contacts
- **Security Lead**: security@yourcompany.com
- **On-Call Engineer**: Defined in PagerDuty/OpsGenie
- **Legal**: legal@yourcompany.com

## Security Checklist for Production

- [ ] Change all default passwords and secrets
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure rate limiting
- [ ] Set up automated backups
- [ ] Enable database SSL connections
- [ ] Configure firewall rules (database not public)
- [ ] Set up vulnerability scanning
- [ ] Configure monitoring and alerting
- [ ] Implement log aggregation (ELK, DataDog)
- [ ] Enable audit logging for all changes
- [ ] Set up incident response procedures
- [ ] Conduct security audit/penetration test
- [ ] Document security policies
- [ ] Train team on security best practices
- [ ] Implement backup recovery testing
- [ ] Configure session timeout
- [ ] Enable 2FA for admin accounts (future enhancement)

## Known Limitations

1. **No 2FA**: Two-factor authentication not yet implemented
2. **Rate Limiting**: Not enabled by default (add in production)
3. **Session Invalidation**: No server-side token blacklist
4. **Password Reset**: Email-based reset not implemented
5. **Account Lockout**: No automatic lockout after failed attempts

## Future Enhancements

1. Implement two-factor authentication (TOTP)
2. Add OAuth2/OIDC integration (Google, Microsoft)
3. Implement server-side session management
4. Add IP whitelisting for sensitive endpoints
5. Implement anomaly detection for suspicious activity
6. Add field-level encryption for sensitive data
7. Implement certificate pinning for mobile apps
8. Add biometric authentication support
