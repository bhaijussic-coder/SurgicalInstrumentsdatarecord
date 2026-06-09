# Deployment Guide - Render

## Prerequisites
1. **GitHub Account** - Push your code to GitHub
2. **Render Account** - Sign up at https://render.com
3. **MySQL Database** - You need a hosted MySQL instance (see options below)

## Step 1: Set Up MySQL Database

### Option A: PlanetScale (Recommended - Free Tier Available)
1. Go to https://planetscale.com and sign up
2. Create a new database: `instrument_testing`
3. Get your connection string (looks like: `mysql://username:password@host/instrument_testing`)
4. Note: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_PORT`

### Option B: AWS RDS
1. Create an RDS MySQL instance (Free tier available)
2. Get the endpoint URL and credentials
3. Note the connection details

### Option C: Your Existing MySQL
If you already have MySQL hosted somewhere, get its connection details.

## Step 2: Push Code to GitHub

```bash
# Navigate to your project
cd "c:\Users\Ssi\OneDrive - Sudhir Srivastava Innovations Pvt. Ltd\Desktop\data"

# Initialize Git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Surgical instrument testing tracker"

# Add remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy on Render

1. Go to https://dashboard.render.com/new/web
2. Connect your GitHub repository
3. Select this repository
4. Render will read [`render.yaml`](/c:/Users/Ssi/OneDrive%20-%20Sudhir%20Srivastava%20Innovations%20Pvt.%20Ltd/Desktop/data/render.yaml)
5. Create the service using the blueprint or set these values manually:
   - **Name**: `surgical-instrument-backend`
   - **Runtime**: `Node`
   - **Build Command**: `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - **Start Command**: `node backend/src/server.js`
   - **Health Check Path**: `/api/health`
   - **Plan**: Free or higher

6. Add environment variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = generate a strong secret or let Render generate one
   - `JWT_EXPIRES_IN` = `12h`
   - `MYSQL_HOST` = your MySQL host
   - `MYSQL_USER` = your MySQL user
   - `MYSQL_PASSWORD` = your MySQL password
   - `MYSQL_DATABASE` = `instrument_testing`
   - `MYSQL_PORT` = `3306`
   - `ALLOWED_ORIGINS` = `https://surgical-instrument-backend.onrender.com`

## Step 4: Initialize Database

Render does not provide MySQL in this project, so connect the backend to an external MySQL instance.

1. Create the database `instrument_testing` on your MySQL server.
2. Run [`backend/sql/schema.sql`](/c:/Users/Ssi/OneDrive%20-%20Sudhir%20Srivastava%20Innovations%20Pvt.%20Ltd/Desktop/data/backend/sql/schema.sql) against that database.
3. Deploy the service on Render after the database is ready.

## Accessing Your App

Your app will be available at the Render service URL, for example:
`https://surgical-instrument-backend.onrender.com`

The frontend and backend are served from the same origin, so the browser will call `/api/...` on the same Render service.

## Troubleshooting

### Backend Not Connecting to MySQL
- Check MySQL credentials in environment variables
- Verify MySQL instance is accessible from Render (no firewall blocks)
- Check logs: `View Logs` in Render dashboard

### Frontend Shows Errors
- Check browser console (F12)
- Verify `ALLOWED_ORIGINS` matches the Render service URL
- Check Render build logs

### Database Schema Not Created
- You may need to run the SQL schema manually
- Connect to your MySQL and run `backend/sql/schema.sql`

## Environment Variables Reference

```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key-here
MYSQL_HOST=your-mysql-host
MYSQL_PORT=3306
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=instrument_testing
ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
```

## Next Steps
- Set up automated deployments (Render auto-deploys on git push)
- Configure a custom domain if you want a branded URL
- Set up monitoring and alerts
