# Contributing to Nightasaur

Thank you for your interest in contributing to Nightasaur! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- Python >= 3.11
- Git

### Development Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/nightasaur.git
   cd nightasaur
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
5. Start development servers:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes for production
- `docs/` - Documentation changes
- `refactor/` - Code refactoring

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### Pull Request Process
1. Create a new branch from `main`
2. Make your changes
3. Add or update tests as needed
4. Update documentation
5. Ensure all tests pass
6. Submit a pull request

## Project Structure

```
nightasaur/
├── apps/
│   ├── backend/     # Node.js backend (Express + Prisma)
│   ├── web/         # React frontend
│   ├── ai-engine/   # Python AI engine
│   └── mobile/      # React Native app
├── packages/        # Shared packages
└── docs/           # Documentation
```

## Testing

### Backend Tests
```bash
cd apps/backend
npm test
```

### Frontend Tests
```bash
cd apps/web
npm test
```

### AI Engine Tests
```bash
cd apps/ai-engine
pytest
```

## Code Style

### TypeScript/JavaScript
- Use ESLint and Prettier
- Follow TypeScript strict mode
- Use async/await for asynchronous code

### Python
- Follow PEP 8
- Use type hints
- Use async/await for asynchronous code

### React
- Use functional components with hooks
- Use TypeScript for type safety
- Follow component composition patterns

## Documentation

### Code Documentation
- Use JSDoc for TypeScript/JavaScript
- Use docstrings for Python
- Document complex algorithms and business logic

### API Documentation
- Update OpenAPI/Swagger documentation
- Document breaking changes
- Provide migration guides when needed

## Reporting Issues

### Bug Reports
1. Use the issue template
2. Describe the expected behavior
3. Describe the actual behavior
4. Provide steps to reproduce
5. Include environment details

### Feature Requests
1. Describe the feature
2. Explain the use case
3. Suggest implementation approach
4. Discuss alternatives considered

## Community

### Communication Channels
- GitHub Discussions: For questions and discussions
- GitHub Issues: For bugs and feature requests
- Discord: [Join our community](https://discord.gg/2Eb4nkk8E)

### Getting Help
1. Check the documentation
2. Search existing issues
3. Ask in GitHub Discussions
4. Join our [Discord community](https://discord.gg/2Eb4nkk8E)

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes
- Project documentation

Thank you for contributing to Nightasaur! 🎉