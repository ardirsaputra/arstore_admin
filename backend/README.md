# ArStore Admin Backend

Node.js/Express API server using [NeonDB](https://neon.tech) (serverless PostgreSQL).

## Setup

### 1. Create NeonDB project

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create new project → **arstore**
3. Copy the connection string from **Connection Details**

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/arstore?sslmode=require
JWT_SECRET=your-very-long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword!
```

### 3. Install dependencies

```bash
npm install
```

### 4. Initialize database (create tables + default admin)

```bash
node db/init.js
```

### 5. Start server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:3001`.

---

## API Endpoints

### Mobile App

| Method | Path                         | Description                       |
| ------ | ---------------------------- | --------------------------------- |
| POST   | `/api/license/register`      | Register device / start trial     |
| GET    | `/api/license/status/:id`    | Get license status                |
| POST   | `/api/license/activate`      | Activate with code                |
| POST   | `/api/license/register-user` | Attach user name/email            |
| GET    | `/api/payment-info`          | Get payment/contact info (public) |
| POST   | `/api/feature-requests`      | Submit feature request            |

### Admin (requires `Authorization: Bearer <token>`)

| Method | Path                                   | Description                               |
| ------ | -------------------------------------- | ----------------------------------------- |
| POST   | `/api/admin/auth/login`                | Login → JWT token                         |
| GET    | `/api/admin/stats`                     | Dashboard stats                           |
| GET    | `/api/admin/devices`                   | List devices (`?status=&q=`)              |
| GET    | `/api/admin/devices/:id`               | Get device                                |
| POST   | `/api/admin/devices/:id/activate`      | Activate (`{ expiry_date?, permanent? }`) |
| POST   | `/api/admin/devices/:id/revoke`        | Revoke license                            |
| POST   | `/api/admin/codes/generate`            | Generate codes (`{ type, quantity }`)     |
| GET    | `/api/admin/codes`                     | List codes (`?unused=true`)               |
| GET    | `/api/admin/payment-info`              | Get payment info                          |
| PUT    | `/api/admin/payment-info`              | Update payment info                       |
| GET    | `/api/admin/feature-requests`          | List requests (`?unread=true`)            |
| PATCH  | `/api/admin/feature-requests/:id/read` | Mark as read                              |

## Deploy to Railway / Render

1. Push this `backend/` folder to a Git repo
2. Connect to Railway or Render
3. Set environment variables from `.env`
4. Deploy — they auto-detect Node.js from `package.json`

## Flutter Admin Web — API URL

Build the Flutter web app pointing to this backend:

```bash
flutter build web --dart-define=API_BASE_URL=https://your-backend.railway.app/api/admin
```
