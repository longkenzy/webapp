# Security Recommendations

## ⚠️ Issues Found (From Database Logs - 2025-10-21)

### 1. Brute Force Attacks on PostgreSQL
Multiple failed login attempts with non-existent users:
```
FATAL: password authentication failed for user "pgsql"
FATAL: password authentication failed for user "postgre"
```

**Time stamps:**
- 04:18:57 UTC
- 04:21:39 UTC
- 04:26:17 UTC
- 04:27:55 UTC
- 04:30:50 UTC

### 2. Database Duplicate Key Errors
Partner creation attempts with duplicate shortName "THÁI TÚ":
- **Fixed**: Added validation in `/api/partners` route (2025-10-21)

---

## 🛡️ Recommended Actions

### Immediate Actions (High Priority)

#### 1. **Restrict PostgreSQL Network Access**
Edit `/etc/postgresql/*/main/pg_hba.conf`:

```bash
# Only allow connections from localhost
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256

# If you need remote access, specify exact IPs
# host    all             all             YOUR_APP_SERVER_IP/32  scram-sha-256
```

Then restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

#### 2. **Change PostgreSQL Port (Security by Obscurity)**
Edit `/etc/postgresql/*/main/postgresql.conf`:
```
port = 5433  # Change from default 5432
```

Update your `.env`:
```
DATABASE_URL="postgresql://user:pass@localhost:5433/dbname"
```

#### 3. **Install and Configure Fail2Ban**
```bash
# Install fail2ban
sudo apt-get install fail2ban

# Create PostgreSQL filter
sudo nano /etc/fail2ban/filter.d/postgresql.conf
```

Add this content:
```ini
[Definition]
failregex = FATAL:  password authentication failed for user
ignoreregex =
```

Configure jail:
```bash
sudo nano /etc/fail2ban/jail.local
```

Add:
```ini
[postgresql]
enabled  = true
port     = postgresql,5432
filter   = postgresql
logpath  = /var/log/postgresql/postgresql-*-main.log
maxretry = 3
bantime  = 3600
findtime = 600
```

Restart fail2ban:
```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status postgresql
```

#### 4. **Setup Firewall (UFW)**
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block PostgreSQL from outside (only localhost can access)
sudo ufw deny 5432/tcp

# Enable firewall
sudo ufw enable
```

### Medium Priority

#### 5. **Add Rate Limiting to Auth APIs**
Create middleware for authentication endpoints:

```typescript
// src/middleware/rateLimit.ts
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Optional: Use memory store for development
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
  analytics: true,
});

export async function authRateLimit(request: NextRequest) {
  const ip = request.ip ?? 'anonymous';
  const { success, reset } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        }
      }
    );
  }
  
  return null; // Allow request
}
```

#### 6. **Enable PostgreSQL Logging for Monitoring**
Edit `/etc/postgresql/*/main/postgresql.conf`:
```
log_connections = on
log_disconnections = on
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

#### 7. **Monitor Logs Regularly**
Setup log monitoring:
```bash
# Install logwatch
sudo apt-get install logwatch

# Configure to send daily reports
sudo logwatch --detail High --service postgresql --range today --format html --mailto your@email.com
```

### Low Priority (Best Practices)

#### 8. **Use Strong PostgreSQL Password**
```bash
# Generate strong password
openssl rand -base64 32

# Change PostgreSQL password
sudo -u postgres psql
ALTER USER your_db_user WITH PASSWORD 'new_strong_password';
```

#### 9. **Enable SSL for PostgreSQL Connections**
```bash
# Generate self-signed certificate
sudo openssl req -new -x509 -days 365 -nodes -text -out server.crt -keyout server.key -subj "/CN=your-domain.com"

# Move to PostgreSQL directory
sudo cp server.crt /var/lib/postgresql/*/main/
sudo cp server.key /var/lib/postgresql/*/main/
sudo chmod 600 /var/lib/postgresql/*/main/server.key
sudo chown postgres:postgres /var/lib/postgresql/*/main/server.*
```

Edit `postgresql.conf`:
```
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

Update DATABASE_URL:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname?sslmode=require"
```

#### 10. **Regular Security Audits**
```bash
# Check for unusual connections
sudo grep "authentication failed" /var/log/postgresql/postgresql-*-main.log | wc -l

# List all active connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check database size
sudo -u postgres psql -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size FROM pg_database;"
```

---

## 📊 Monitoring Commands

### Check Current Failed Login Attempts
```bash
sudo grep "authentication failed" /var/log/postgresql/postgresql-*-main.log | tail -20
```

### Check Fail2Ban Status
```bash
sudo fail2ban-client status postgresql
```

### Check Active Firewall Rules
```bash
sudo ufw status verbose
```

### Monitor Real-time PostgreSQL Connections
```bash
watch -n 2 'sudo -u postgres psql -c "SELECT pid, usename, client_addr, state FROM pg_stat_activity WHERE client_addr IS NOT NULL;"'
```

---

## 🚨 If You Suspect an Active Attack

1. **Immediately block attacking IPs:**
```bash
sudo ufw deny from ATTACKING_IP
```

2. **Check current connections:**
```bash
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

3. **Kill suspicious connections:**
```bash
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE client_addr = 'ATTACKING_IP';"
```

4. **Review logs:**
```bash
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

---

## ✅ Verification Checklist

After implementing these security measures:

- [ ] PostgreSQL only accepts connections from localhost/known IPs
- [ ] Fail2Ban is active and monitoring PostgreSQL
- [ ] Firewall (UFW) is enabled and configured
- [ ] PostgreSQL is not using default port 5432
- [ ] Rate limiting is implemented on auth endpoints
- [ ] SSL is enabled for database connections
- [ ] Strong passwords are in use
- [ ] Log monitoring is active
- [ ] No recent failed authentication attempts in logs

---

## 📝 Notes

- The attacks occurred between 04:18 - 04:30 UTC on October 21, 2025
- Attackers tried usernames: `pgsql`, `postgre` (common PostgreSQL username variations)
- This suggests automated brute force attempts
- **Current status**: App is still functional, but database is exposed to attacks

**Priority**: Implement at least items 1-4 (Immediate Actions) as soon as possible.

