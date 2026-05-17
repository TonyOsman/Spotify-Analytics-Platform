# Spotify AI DJ

Your personal AI DJ that creates playlists based on vibes and moods. Built with Next.js, Spotify API, and AI.

## Features

- **AI DJ Chat**: Describe your mood ("chill vibes for studying") and get a curated playlist
- **DJ Commentary**: AI explains why each song fits your vibe
- **Wrapped-style Stats**: See your top tracks, artists, and genres
- **In-app Playback**: Full Spotify playback controls (Premium required)
- **Save to Spotify**: Export AI-generated playlists to your Spotify account

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Neon PostgreSQL
- **ORM**: Prisma 7
- **Auth**: NextAuth.js v5 with Spotify OAuth
- **AI**: Groq (free tier) or OpenAI
- **Styling**: Tailwind CSS

## Setup

### 1. Clone and Install

```bash
cd spotify-ai-dj
npm install
```

### 2. Create Environment File

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

### 3. Get Credentials

#### Spotify Developer (Required)
1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Set Redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/spotify`
   - Production: `https://your-app.vercel.app/api/auth/callback/spotify`
4. Copy **Client ID** and **Client Secret**

#### Neon PostgreSQL (Required)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

#### Groq AI (Required for AI DJ)
1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key
3. Copy to `GROQ_API_KEY`

#### NextAuth Secret (Required)
Generate a secret:
```bash
openssl rand -base64 32
```
Copy to `NEXTAUTH_SECRET`

### 4. Set Up Database

```bash
npx prisma db push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Login**: Click "Get Started with Spotify" and authorize the app
2. **Sync**: Go to Dashboard and click "Sync" to fetch your Spotify data
3. **AI DJ**: Go to AI DJ, type a vibe like "late night chill" and get a playlist
4. **Play**: Click "Play All" to start playing (requires Spotify Premium)
5. **Save**: Click "Save to Spotify" to export the playlist

## Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXTAUTH_URL` | Your app URL | `http://localhost:3000` for dev |
| `NEXTAUTH_SECRET` | Random secret | `openssl rand -base64 32` |
| `SPOTIFY_CLIENT_ID` | Spotify app ID | Spotify Dashboard |
| `SPOTIFY_CLIENT_SECRET` | Spotify app secret | Spotify Dashboard |
| `DATABASE_URL` | PostgreSQL connection | Neon Dashboard |
| `GROQ_API_KEY` | Groq API key | Groq Console |

## Deployment to Vercel

1. Push to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add all environment variables
4. Update Spotify redirect URI to production URL
5. Deploy

## Spotify Premium Note

In-app playback requires Spotify Premium. Free users can still:
- View their stats
- Generate AI playlists
- Save playlists to Spotify (play in Spotify app)

## License

MIT
