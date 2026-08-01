# OLX Clone — Property Rental API

> A production-ready RESTful API for a property rental platform, built with **Node.js**, **Express**, **MongoDB**, and **TypeScript**.

---

## 🚀 Features

- ✅ Clean Architecture (Controllers → Services → Repositories → Models)
- ✅ JWT Authentication (Access + Refresh tokens with separate secrets)
- ✅ OTP Verification via SMS (Twilio)
- ✅ Role-based Authorization Middleware
- ✅ Standardized API Responses `{ success, message, data }`
- ✅ Custom Typed Error Classes
- ✅ Global Error Handling (Mongoose, MongoDB, operational errors)
- ✅ Input Sanitization (NoSQL Injection prevention)
- ✅ Rate Limiting (global + stricter auth-specific)
- ✅ Swagger API Documentation
- ✅ Zod Request Validation
- ✅ Winston Logger

---

## 📁 Folder Structure

```
src/
├── config/          # Environment variables, database connection
├── controllers/     # Request/response handlers (no business logic)
├── docs/            # Swagger specification
├── interfaces/      # TypeScript interfaces and enums
├── middlewares/     # Auth, validation, error handling
├── models/          # Mongoose schemas and models
├── repositories/    # (Ready for Phase 2+) DB query abstraction
├── routes/          # Express routers with Swagger JSDoc
├── services/        # Business logic layer
├── socket/          # (Ready for Chat phase) Socket.io setup
├── types/           # Shared TypeScript types
├── utils/           # AppError, ApiResponse, asyncHandler, logger
├── validators/      # Zod validation schemas
├── app.ts           # Express app setup and middleware stack
└── server.ts        # Server entry point
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root with the following:

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for access tokens | `strongrandomstring` |
| `JWT_REFRESH_SECRET` | Separate secret for refresh tokens | `anotherrandomstring` |
| `JWT_EXPIRES_IN` | Access token expiration | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `ACxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `xxxxxxxx` |
| `TWILIO_PHONE_NUMBER` | Twilio sender phone number | `+1234567890` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `mycloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `xxxxxxxx` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username/email | `user@gmail.com` |
| `SMTP_PASS` | SMTP password | `apppassword` |
| `EMAIL_FROM` | Default from email address | `noreply@olxclone.com` |

---

## 🛠️ Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/freelance_olx.git
cd freelance_olx

# 2. Install dependencies
npm install

# 3. Copy and fill environment variables
cp .env.example .env

# 4. Run in development mode
npm run dev
```

---

## 🏃 Running Locally

```bash
# Development (with hot-reload via nodemon)
npm run dev

# Type checking
npm run build

# Linting
npm run lint

# Format
npm run format
```

---

## 📖 API Documentation

Swagger UI is available at:
```
http://localhost:3000/api/v1/docs
```

---

## 📋 API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | ❌ | Register a new user |
| `POST` | `/login` | ❌ | Login with email & password |
| `POST` | `/logout` | ❌ | Invalidate refresh token |
| `POST` | `/refresh-token` | ❌ | Get new token pair |
| `POST` | `/forgot-password` | ❌ | Request password reset |
| `POST` | `/reset-password?token=` | ❌ | Reset password |
| `GET` | `/me` | ✅ | Get current user profile |
| `POST` | `/resend-otp` | ✅ | Send OTP to phone/email |
| `POST` | `/verify-otp` | ✅ | Verify OTP code |

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/docs` | Swagger UI |

---

## 🗺️ Roadmap

Future phases will include:
- [ ] Property CRUD (listings)
- [ ] Categories & Tags
- [ ] Favorites
- [ ] Reports & Moderation
- [ ] Block Users
- [ ] Real-time Chat (Socket.io)
- [ ] Notifications
- [ ] Admin Dashboard
- [ ] Cloudinary Image Upload
- [ ] Advanced Search & Filters
- [ ] Maps Integration
- [ ] Docker & Deployment

---

## 🔒 Security

- Passwords hashed with **bcryptjs** (salt rounds: 10)
- Separate **JWT secrets** for access and refresh tokens
- **Helmet** HTTP security headers
- **Rate limiting** on all API routes (100 req/15min) with stricter limits on auth (20 req/15min)
- **NoSQL injection** prevention via `express-mongo-sanitize`
- Input validation on every endpoint via **Zod**
- **OTP brute-force** protection (max 5 attempts, then OTP is deleted)
