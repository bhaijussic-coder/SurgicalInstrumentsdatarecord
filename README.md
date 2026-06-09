# Surgical Instrument Testing Tracker

Production-focused full-stack web app for surgical instrument testing records, history, reporting, and role-based access.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + JWT
- Database: MySQL (mysql2/promise)
- Reports: Excel + PDF

## Features
- Role-based login (`admin`, `tester`, `viewer`)
- Dashboard with daily totals, pass/fail trend, recent records, and search/sort
- Test entry and update workflow with repeat-failure alert logic
- Instrument history tracking by serial number
- Daily/weekly/monthly reports with filters and export
- Admin user management and backup/restore APIs

## Project Structure
```txt
backend/
  src/
frontend/
  src/
```

## Environment Setup

### Backend `.env`
Copy `backend/.env.example` to `backend/.env`:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=change_this_super_secret_value
JWT_EXPIRES_IN=12h
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=instrument_testing
ALLOWED_ORIGINS=http://localhost:5173
```

The backend uses MySQL for all database operations. If you need to initialize the schema, run the SQL script in `backend/sql/schema.sql` against your MySQL server.

### Frontend `.env`
Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://127.0.0.1:5000
```

## Local Run

### 1) Backend
```bash
cd backend
npm install
npm run dev
```
Make sure MySQL is running and reachable using the credentials in `backend/.env` before starting the backend.
You can test the database connection with `npm run test-db` after setting `backend/.env`.

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`

The frontend now proxies `/api` requests to the backend in local development, so browser requests stay on `http://localhost:5173` and avoid CORS issues.
`VITE_API_PROXY_TARGET` should point at the backend port, usually `http://127.0.0.1:5000`.
If port `5173` is already in use, stop the other process before starting Vite.

## Production Deployment

### Render
- Use [`render.yaml`](/c:/Users/Ssi/OneDrive%20-%20Sudhir%20Srivastava%20Innovations%20Pvt.%20Ltd/Desktop/data/render.yaml) to deploy a single Node web service.
- The service builds the frontend first, then starts the backend.
- The backend serves the React app in production, so the frontend and API share the same origin.
- Set `ALLOWED_ORIGINS` to the Render service URL, for example `https://surgical-instrument-backend.onrender.com`.
- Use an external MySQL instance and run [`backend/sql/schema.sql`](/c:/Users/Ssi/OneDrive%20-%20Sudhir%20Srivastava%20Innovations%20Pvt.%20Ltd/Desktop/data/backend/sql/schema.sql) before the first deploy.

### Production Notes
- Confirm backend can connect to MySQL before deployment.
- Use HTTPS in production and keep `JWT_SECRET` confidential.
- Monitor API logs for connectivity and auth issues.
- Ensure first account is created by calling `POST /api/auth/register` once, then create app users from the admin UI.

## First Login (Bootstrap)
- Call `POST /api/auth/register` once when no users exist.
- After the first user is created, self-registration is blocked.
- Admins create all other users from the Users page/API.

## Production Deployment Checklist
- Use a managed MySQL database and secure credentials for `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE`
- Set a strong random `JWT_SECRET`
- Set `NODE_ENV=production`
- Set `ALLOWED_ORIGINS` to the Render service URL
- Run backend with `npm start`
- Build the frontend before the backend starts so the backend can serve `frontend/dist`
- Keep the SPA rewrite in the backend so client routes still load
- Put backend behind HTTPS reverse proxy/load balancer
- Monitor logs and schedule regular backup exports

## Health Check
- `GET /api/health` returns `{ "status": "ok" }`
