# Snabb

A local services marketplace built with React Native (Expo), Next.js, and FastAPI.

## Features

- Redis-cached API responses
- React Query for data fetching
- Dark mode support
- Infinite scroll with pagination
- Pull-to-refresh
- Design system with theme tokens
- TypeScript throughout

## Tech Stack

### Mobile
- React Native 0.81.5
- Expo SDK 54
- TypeScript 5.9
- TanStack Query
- React Navigation 7
- React Native Reanimated

### Web
- Next.js 16
- React 19
- Tailwind CSS 4
- Framer Motion

### Backend
- FastAPI 0.115
- SQLAlchemy 2.0
- Redis (caching)
- PostgreSQL
- Gunicorn

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Web
cd web
npm install
npm run dev

# Mobile
cd mobile
npm install
npm start
```

## Documentation

- [Quick Start Guide](./QUICKSTART.md)
- [Deployment Guide](./backend/DEPLOYMENT.md)

## Development

```bash
# Run linter
npm run lint

# Run tests
npm test

# Build mobile for production
eas build --platform all
```

## License

MIT
