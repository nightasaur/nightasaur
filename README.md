# 🌙 Nightasaur - Open Source AI Digital Spirit & Personal Assistant Platform

> Create and evolve your AI spirit companion, or switch to a powerful personal AI assistant. 100% open source.

[![License](https://img.shields.io/github/license/nightasaur/nightasaur)](https://github.com/nightasaur/nightasaur/blob/main/LICENSE)
[![Version](https://img.shields.io/github/v/release/nightasaur/nightasaur)](https://github.com/nightasaur/nightasaur/releases)
[![Stars](https://img.shields.io/github/stars/nightasaur/nightasaur)](https://github.com/nightasaur/nightasaur/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/nightasaur/nightasaur/blob/main/CONTRIBUTING.md)

## ✨ Features

### 🐉 Digital Spirit System
- Create and evolve AI spirit companions
- 10 elemental types with unique personalities
- Interactive dialogue with memory context
- Visual evolution through AI image generation

### 🤖 Personal AI Assistant
- General knowledge Q&A like ChatGPT
- Code assistance and debugging
- Document analysis and summarization
- Multi-language translation
- File processing (PDF, Word, Images)

### 🌐 Full-Stack Platform
- Modern web interface (React + TypeScript)
- Robust backend API (Node.js + Express)
- AI engine with local LLM support (Ollama)
- Mobile app ready (React Native)
- Social media integration (FB/IG)

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- Python >= 3.11
- PostgreSQL >= 14
- Ollama (for local LLM)

### Installation
```bash
# Clone the repository
git clone https://github.com/nightasaur/nightasaur.git
cd nightasaur

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start all services
npm run dev
```

### Access URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3002
- **AI Engine**: http://localhost:8000
- **API Documentation**: http://localhost:3002/api-docs

## 🏗️ Architecture

```
nightasaur/
├── apps/
│   ├── backend/          # Node.js + Express + Prisma
│   │   └── src/
│   │       ├── controllers/
│   │       ├── routes/   # API endpoints
│   │       ├── services/ # Business logic
│   │       └── jobs/     # Scheduled tasks
│   ├── web/             # React + Vite + Tailwind
│   │   └── src/
│   │       ├── pages/    # Application pages
│   │       ├── components/
│   │       └── api/      # API client
│   ├── ai-engine/       # Python + FastAPI
│   │   ├── routers/     # AI endpoints
│   │   ├── services/    # LLM, ComfyUI
│   │   └── training/    # LoRA training
│   └── mobile/          # React Native + Expo
├── packages/shared/     # Shared utilities
└── docs/               # Documentation
```

## 📡 API Overview

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get user profile
- `POST /api/auth/logout` - User logout

### Spirit Management
- `POST /api/spirits` - Create a new spirit
- `GET /api/spirits` - List user's spirits
- `GET /api/spirits/:id` - Get spirit details
- `POST /api/spirits/:id/evolve` - Evolve spirit

### Personal Assistant
- `POST /api/assistant/chat` - General AI chat
- `POST /api/assistant/code` - Code assistance
- `POST /api/assistant/document` - Document analysis
- `POST /api/assistant/translate` - Translation
- `POST /api/assistant/upload` - File upload

### AI Generation
- `POST /api/generate/image` - Generate spirit images
- `POST /api/dialogue/chat` - Spirit dialogue
- `GET /api/health` - System health check

## 🎮 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nightasaur.com | admin123! |
| Trainer | demo@nightasaur.com | demo1234 |

## 🔧 Development

### Setting Up Development Environment
```bash
# 1. Install dependencies
npm install

# 2. Set up database
npm run db:migrate
npm run db:seed

# 3. Start development servers
npm run dev

# 4. Run tests
npm test
```

### Code Style
- TypeScript with strict mode
- ESLint + Prettier for code formatting
- Conventional commits
- Comprehensive testing

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code of Conduct
Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## 📚 Documentation

- [API Documentation](docs/API.md) - Complete API reference
- [Development Guide](docs/DEVELOPMENT.md) - Development setup
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Architecture Overview](docs/ARCHITECTURE.md) - System architecture

## 🚢 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

### Manual Deployment
```bash
# Build all applications
npm run build

# Start production servers
npm start
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.com/) for local LLM support
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) for image generation
- [Prisma](https://www.prisma.io/) for database ORM
- [FastAPI](https://fastapi.tiangolo.com/) for Python API framework

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/nightasaur/nightasaur/issues)
- **Discord**: [Join our community](https://discord.gg/YOUR-INVITE-LINK)
- **Email**: support@nightasaur.com

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=nightasaur/nightasaur&type=Date)](https://star-history.com/#nightasaur/nightasaur&Date)

---

**Made with ❤️ by the Nightasaur Team | Open Source AI Platform**