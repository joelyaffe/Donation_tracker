# Diet Tracker

A voice-powered diet tracking PWA with AI nutrition estimation.

## Features

- 🎤 Voice input for hands-free food logging
- 🤖 AI-powered nutrition estimation using Claude
- 📊 Analytics and trends over time
- 📱 PWA - installable on mobile devices
- 🍔 Uses official brand nutritional data when available

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your-key-here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel (Free)

### Step 1: Set Up Turso Database (Free)

1. Install Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. Sign up for Turso:
   ```bash
   turso auth signup
   ```

3. Create a database:
   ```bash
   turso db create diet-tracker
   ```

4. Get your database URL:
   ```bash
   turso db show diet-tracker --url
   ```
   (Copy this - you'll need it for Vercel)

5. Create an auth token:
   ```bash
   turso db tokens create diet-tracker
   ```
   (Copy this - you'll need it for Vercel)

6. Initialize the database:
   ```bash
   TURSO_DATABASE_URL=<your-url> TURSO_AUTH_TOKEN=<your-token> npm run db:setup
   ```

### Step 2: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/diet-tracker.git
   git push -u origin main
   ```

### Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your `diet-tracker` repository
4. Add Environment Variables:
   - `ANTHROPIC_API_KEY` - Your Anthropic API key
   - `TURSO_DATABASE_URL` - Your Turso database URL (from step 1)
   - `TURSO_AUTH_TOKEN` - Your Turso auth token (from step 1)
5. Click "Deploy"

Your app will be live at `https://your-project.vercel.app` with automatic HTTPS!

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes |
| `TURSO_DATABASE_URL` | Turso database URL | Production only |
| `TURSO_AUTH_TOKEN` | Turso auth token | Production only |

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic Claude API
- Turso (LibSQL) for production database
- SQLite for local development
- Recharts for analytics
- Web Speech API for voice input
