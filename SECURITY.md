# Security Policy

## Supported Versions

| Version | Supported |
|---------|----------|
| 1.0.x   | ✅ |
| < 1.0   | ❌ |

## Reporting a Vulnerability

We take the security of Nightasaur seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT report vulnerabilities via public GitHub Issues

Instead, please report them privately:

- **Email**: security@nightasaur.com
- **GitHub Security Advisory**: [Create a private advisory](https://github.com/nightasaur/nightasaur/security/advisories/new)

### 2. What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response timeline

| Time | Action |
|------|--------|
| 24 hours | Initial acknowledgment |
| 48 hours | Assessment and prioritization |
| 5 days | Fix development (critical issues) |
| 14 days | Fix development (non-critical issues) |
| 30 days | Public disclosure (after fix) |

## Security Best Practices

### For Users
- Always use the latest version
- Keep your Ollama installation updated
- Use strong passwords
- Enable two-factor authentication where possible
- Never share your JWT token

### For Developers
- Run `npm audit` regularly to check for dependency vulnerabilities
- Keep all dependencies updated
- Use environment variables for sensitive data
- Never commit `.env` files or API keys
- Follow the principle of least privilege
- Validate all user inputs
- Use parameterized queries (Prisma handles this automatically)

## Known Security Measures

### Authentication
- JWT tokens with 24-hour expiration
- bcrypt password hashing (12 rounds)
- Session management
- Rate limiting on auth endpoints

### Data Protection
- All passwords hashed with bcrypt
- API keys stored in environment variables
- CORS protection
- SQL injection protection via Prisma ORM
- XSS protection via React

### Infrastructure
- HTTPS enforced (Vercel/Railway)
- Automatic SSL certificates
- DDoS protection (Cloudflare ready)
- Database connection pooling

## Dependencies

We regularly audit our dependencies. Key security-critical dependencies:

| Package | Purpose | Security Notes |
|---------|---------|----------------|
| bcryptjs | Password hashing | Industry standard |
| jsonwebtoken | JWT tokens | Well-maintained |
| Prisma | Database ORM | Parameterized queries |
| Express | Web framework | Security middleware |
| React | Frontend | XSS protection |

## Security Updates

Security advisories will be published:
- On GitHub: [Security Advisories](https://github.com/nightasaur/nightasaur/security/advisories)
- On Release: Included in release notes
- For critical: Direct notification via email

---

**Thank you for helping keep Nightasaur secure!** 🔒