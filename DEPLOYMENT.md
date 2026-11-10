# Deployment Checklist

Use this checklist when deploying the ERP system to different environments.

## Pre-Deployment

### Code Quality
- [ ] All code linted and formatted
- [ ] No console.log() statements left (use proper logging)
- [ ] No hardcoded credentials in code
- [ ] All imports use correct paths
- [ ] No unused imports or variables
- [ ] Error handling in all try-catch blocks
- [ ] Audit logging in all service methods

### Testing
- [ ] All unit tests pass
- [ ] All API endpoints tested manually
- [ ] Database migrations tested
- [ ] Edge cases handled (empty results, null values)
- [ ] Concurrent requests tested

### Documentation
- [ ] ARCHITECTURE.md up to date
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Environment variables documented

### Security
- [ ] Secrets not in git (use .env)
- [ ] Password hashing enabled
- [ ] SQL injection prevention (use ORM)
- [ ] CORS configured properly
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints

## Environment Setup

### .env Configuration

Create production `.env`:
```env
NODE_ENV=production
PORT=8000
DB_HOST=your-db-server.com
DB_NAME=erp_system_prod
DB_USER=erp_user
DB_PASS=secure_password_here
ADMIN_EMAIL=admin@company.com
ADMIN_PHONE=+1234567890
LOG_LEVEL=info
API_TIMEOUT=30000
MAX_CONNECTIONS=20
```

### Verify Secrets
- [ ] Database password is strong (20+ chars, mixed case, numbers, symbols)
- [ ] JWT secret configured (if using JWT)
- [ ] API keys secured
- [ ] No secrets in logs
- [ ] Secrets rotated on schedule

### Database Preparation
- [ ] Production database created
- [ ] Database user with limited permissions created
- [ ] Backups configured
- [ ] Connection pooling configured
- [ ] Query timeouts set
- [ ] Indexes created on frequently queried fields

## Deployment Process

### 1. Database Migration
```bash
# Create production database
mysql -u root -p -e "CREATE DATABASE erp_system_prod;"

# Or run migration script
npm run migrate

# Verify schema
mysql -u root -p erp_system_prod -e "SHOW TABLES;"
```

### 2. Code Deployment
```bash
# Clone/pull latest code
git clone <repo> customerLogs-prod
cd customerLogs-prod

# Install dependencies
npm ci  # Use ci instead of install for consistency

# Build (if needed)
npm run build

# Set environment variables
cp .env.example .env
# Edit .env with production values

# Start server
npm start
```

### 3. Verify Deployment
- [ ] Server started without errors
- [ ] Database connected successfully
- [ ] All tables created
- [ ] Sample API call works
- [ ] Audit logs being recorded
- [ ] Error logs viewable

### 4. Health Check
```bash
# Test API health
curl http://localhost:8000/api/customers/search?q=test

# Check database connection
curl http://localhost:8000/api/health  # If endpoint exists

# View application logs
tail -f logs/app.log
```

## Environment-Specific Checklists

### Development Environment
- [ ] Debugging enabled
- [ ] Hot-reload enabled (nodemon)
- [ ] Verbose logging
- [ ] Sample data loaded
- [ ] All endpoints tested locally
- [ ] Events triggering correctly

### Staging Environment
- [ ] Production database (anonymized data)
- [ ] Production-like configuration
- [ ] Performance tested under load
- [ ] Backup/restore tested
- [ ] Monitoring configured
- [ ] All integrations tested

### Production Environment
- [ ] Database backups automated daily
- [ ] Error alerting configured
- [ ] Performance monitoring active
- [ ] Rate limiting enforced
- [ ] SSL/HTTPS enabled
- [ ] Firewall rules configured
- [ ] Only necessary ports open
- [ ] Regular security updates scheduled
- [ ] Disaster recovery plan documented

## Post-Deployment

### Monitoring
- [ ] Application uptime monitored
- [ ] Database performance monitored
- [ ] API response times logged
- [ ] Error rates tracked
- [ ] Audit logs reviewed regularly
- [ ] Disk space monitored
- [ ] Memory usage monitored

### Maintenance
- [ ] Weekly backups verified
- [ ] Logs rotated weekly
- [ ] Failed requests reviewed daily
- [ ] Database analyzed and optimized monthly
- [ ] Security patches applied promptly

### Rollback Plan
- [ ] Previous version backed up
- [ ] Rollback procedure documented
- [ ] Database backup before major changes
- [ ] Feature flags for safe rollout
- [ ] Canary deployment planned for large changes

## Troubleshooting Deployments

### Database Connection Failed
```bash
# Check credentials
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "SHOW DATABASES;"

# Verify firewall
telnet $DB_HOST 3306

# Check logs
tail -f logs/app.log
```

### Port Already in Use
```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
PORT=8001 npm start
```

### Out of Memory
```bash
# Check memory usage
free -h
ps aux | grep node

# Increase Node heap size
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

### Database Locked
```bash
# Check locks
SHOW PROCESSLIST;

# Kill long-running query
KILL <PROCESS_ID>;
```

### Migration Failed
```bash
# Rollback changes
git revert <commit>

# Restore database backup
mysql erp_system_prod < backup.sql

# Fix and retry
# ...
npm run migrate
```

## Scaling Considerations

### Horizontal Scaling
- [ ] Load balancer configured (nginx, HAProxy)
- [ ] Session management centralized (Redis)
- [ ] Database replicated for read scaling
- [ ] Static files served from CDN

### Vertical Scaling
- [ ] Increased server resources
- [ ] Node process tuned for memory/CPU
- [ ] Database query optimization
- [ ] Connection pooling increased

### Performance Optimization
- [ ] Database indexes created
- [ ] Query N+1 problems fixed
- [ ] Caching implemented (Redis)
- [ ] API response times < 200ms
- [ ] Database response times < 100ms

## Security Checklist - Final Review

- [ ] All user inputs validated
- [ ] SQL injection prevented (ORM used)
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented (if needed)
- [ ] Rate limiting per endpoint
- [ ] Authentication middleware active
- [ ] Authorization checks in place
- [ ] Secrets never logged
- [ ] Sensitive data encrypted
- [ ] HTTPS enforced
- [ ] Security headers set
- [ ] Dependencies up to date
- [ ] No known vulnerabilities: `npm audit`

## Go-Live Checklist

Final checks before going live:

- [ ] All team members trained
- [ ] Documentation complete
- [ ] Support team briefed
- [ ] Incident response plan ready
- [ ] Monitoring alerts configured
- [ ] On-call schedule arranged
- [ ] Rollback procedure tested
- [ ] Communication plan ready
- [ ] Customer notification prepared
- [ ] Maintenance window scheduled (if needed)

## Post-Go-Live Monitoring (First 24 hours)

- [ ] Check system every hour
- [ ] Review error logs
- [ ] Monitor database performance
- [ ] Check API response times
- [ ] Verify audit logs
- [ ] Test critical workflows
- [ ] Monitor customer reports
- [ ] Be ready to rollback

## Documentation After Deployment

- [ ] Update runbook with actual server details
- [ ] Document any custom configuration
- [ ] Record database connection strings (securely)
- [ ] Document backup procedures
- [ ] Update disaster recovery plan
- [ ] Record team training completed
- [ ] Update on-call procedures

---

## Quick Deployment Script

Save as `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying ERP System..."

# 1. Backup current code
echo "📦 Backing up current version..."
cp -r customerLogs customerLogs-backup-$(date +%Y%m%d_%H%M%S)

# 2. Pull latest code
echo "📥 Pulling latest code..."
cd customerLogs
git pull origin main

# 3. Install dependencies
echo "📚 Installing dependencies..."
npm ci

# 4. Run migrations
echo "🗄️ Running migrations..."
npm run migrate

# 5. Restart server
echo "🔄 Restarting server..."
pm2 restart customerLogs

# 6. Health check
echo "✅ Verifying deployment..."
sleep 5
curl -f http://localhost:8000/api/customers/search?q=test || exit 1

echo "✅ Deployment successful!"
```

Usage:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

For detailed setup instructions, see QUICKSTART.md
For architecture details, see ARCHITECTURE.md
