# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please email the repository owner directly. Do not open a public issue.

## Security Considerations

### Private Key Storage

This application stores user private keys encrypted in a PostgreSQL database. **This approach has inherent security risks:**

1. **Database Breach**: If an attacker gains access to the database, they have encrypted private keys
2. **Encryption Key Exposure**: If `FERNET_ENCRYPTION_KEY` is compromised, all private keys can be decrypted
3. **Memory Exposure**: Private keys are temporarily decrypted in memory during transactions

### Recommended for Production

**Do NOT use this architecture for production with other people's funds.** Consider these alternatives:

1. **Hardware Wallet Integration**: Use Ledger/Trezor for signing
2. **MPC Wallets**: Multi-Party Computation for distributed key management
3. **Custodial Solutions**: Use professional custody services
4. **User-Controlled**: Let users sign transactions in their own wallets

### Before Deployment

#### Mandatory Security Steps

1. **Generate New Encryption Key**
   ```python
   python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

2. **Rotate All Credentials**
   - New Telegram bot token
   - New database with new credentials
   - New API keys (Birdeye, RPC providers)
   - New platform fee wallet

3. **Secure Database**
   - Enable SSL/TLS connections
   - Use strong, unique passwords
   - Restrict network access (firewall rules)
   - Regular automated backups
   - Enable audit logging

4. **Environment Security**
   - Never commit `.env` files
   - Use secret management tools (AWS Secrets Manager, HashiCorp Vault)
   - Restrict file permissions: `chmod 600 .env`
   - Use environment-specific configurations

#### Database Migration Warning

⚠️ **CRITICAL**: If you're migrating from the exposed database in the old code:

1. **Create a new database** with new credentials
2. **Generate a new encryption key** (cannot decrypt old keys with new key)
3. **Do NOT migrate encrypted private keys** - they were encrypted with the exposed key
4. **Notify users** to re-import their wallets with the new bot

### Code Security

#### Input Validation

The current codebase has limited input validation. Before production:

1. Validate all Solana addresses (format, checksums)
2. Sanitize user inputs to prevent injection attacks
3. Implement amount limits to prevent fat-finger errors
4. Add rate limiting to prevent abuse

#### SQL Injection Protection

The code uses pg-promise which provides parameterized queries. However:

- Review all database queries
- Ensure no string concatenation in SQL
- Use prepared statements consistently

#### API Security

1. **Rate Limiting**: Implement on Express endpoints
2. **Authentication**: Add API authentication if exposing webhooks
3. **HTTPS Only**: Use SSL/TLS in production
4. **CORS**: Configure properly if needed

### Operational Security

#### Monitoring

Set up monitoring for:
- Unusual transaction patterns
- Failed authentication attempts
- Database connection errors
- API rate limit hits
- Large withdrawals

#### Logging

- Log all transactions (success and failures)
- Do NOT log private keys or sensitive data
- Implement log rotation
- Secure log storage

#### Backup Strategy

1. **Database Backups**
   - Automated daily backups
   - Test restore procedures
   - Encrypted backup storage
   - Offsite backup copies

2. **Configuration Backups**
   - Backup `.env` files securely (encrypted, offline)
   - Document all API keys and their sources
   - Keep recovery procedures updated

### Infrastructure Security

#### Docker Security

1. **Image Security**
   - Use official base images
   - Regular image updates
   - Scan images for vulnerabilities

2. **Container Isolation**
   - Run as non-root user
   - Use Docker secrets for sensitive data
   - Limit container resources

3. **Network Security**
   - Use Docker networks to isolate services
   - Only expose necessary ports
   - Firewall configuration

#### Server Security

1. **OS Hardening**
   - Regular security updates
   - Disable unnecessary services
   - Configure firewall (ufw, iptables)

2. **Access Control**
   - SSH key authentication only
   - Disable root login
   - Use sudo for privileged operations
   - Implement fail2ban

3. **Network Security**
   - VPN for administrative access
   - Whitelist IP addresses
   - DDoS protection (Cloudflare, AWS Shield)

### Compliance

#### User Data

- Comply with GDPR/local privacy laws
- Implement data deletion procedures
- Privacy policy required
- User consent for data storage

#### Financial Regulations

- Check local regulations for automated trading
- May require licensing depending on jurisdiction
- Consider legal counsel for compliance

### Known Vulnerabilities

#### Current Issues

1. **SSL Certificate Validation Disabled**
   - Location: `src/db/connection.ts`
   - Line: `rejectUnauthorized: false`
   - Fix: Use proper SSL certificates

2. **No Rate Limiting**
   - Endpoints: `/trade_buy`, `/users`
   - Risk: Abuse, DDoS
   - Fix: Implement express-rate-limit

3. **Minimal Input Validation**
   - Risk: Invalid data in database
   - Fix: Add validation middleware

### Security Checklist

Before going live:

- [ ] All hardcoded secrets removed
- [ ] New encryption key generated
- [ ] All API keys rotated
- [ ] New database with strong password
- [ ] SSL/TLS enabled on database
- [ ] Environment variables properly secured
- [ ] Input validation implemented
- [ ] Rate limiting added
- [ ] Monitoring and alerting configured
- [ ] Backup procedures tested
- [ ] Security audit completed
- [ ] Legal compliance verified
- [ ] Error handling reviewed (no secret leaks)
- [ ] Logging configured (no sensitive data)

### Incident Response

If you suspect a security breach:

1. **Immediate Actions**
   - Stop the bot immediately
   - Disconnect from network if needed
   - Preserve logs for analysis

2. **Assessment**
   - Determine scope of breach
   - Identify compromised data
   - Check transaction history

3. **Remediation**
   - Rotate all credentials
   - Patch vulnerability
   - Restore from clean backup if needed

4. **Notification**
   - Notify affected users
   - Report to authorities if required
   - Document incident for future prevention

### Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [Docker Security](https://docs.docker.com/engine/security/)

### Updates

This security policy should be reviewed and updated:
- After any security incident
- When new features are added
- At least quarterly
- When dependencies are updated

Last Updated: 2025-11-09
