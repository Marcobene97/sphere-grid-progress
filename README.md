# Personal Mastery Grid - Productivity Tracker

A deployment-ready gamified productivity application with secure AI integration, database persistence, and comprehensive XP system.

## 🚀 Deployment Ready Features

✅ **Secure AI Integration**: OpenAI calls via Supabase Edge Functions (no browser API keys)  
✅ **Database Persistence**: Full Supabase integration with RLS policies  
✅ **Production Build**: Optimized for CI/CD deployment  
✅ **Unit Tests**: XP engine and core logic tested  
✅ **Environment Config**: Proper .env setup for deployment  
✅ **Vercel Ready**: Configured for seamless Vercel deployment

## 📦 Vercel Deployment

### Prerequisites
1. **Supabase Project**: Set up a Supabase project and configure environment variables
2. **Environment Variables**: Set the following in Vercel dashboard:
   - `VITE_SUPABASE_URL=https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your-anon-key-here`
3. **OpenAI API Key**: Add `OPENAI_API_KEY` in Supabase Edge Function secrets

### Deploy Steps
1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Configure Build**: Vercel auto-detects Vite configuration via `vercel.json`
3. **Set Environment Variables**: Add Supabase credentials in Vercel dashboard
4. **Deploy**: Push to main branch or click "Deploy" in Vercel dashboard

### Local Development
```bash
# Copy environment template
cp .env.example .env

# Add your Supabase credentials to .env
# VITE_SUPABASE_URL=https://your-project-ref.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)  
- **AI**: OpenAI GPT-4o-mini (secure server-side calls)
- **Testing**: Vitest unit tests for XP calculations
- **Deployment**: Vercel with automatic builds

## 📊 Key Features

- **XP System**: Multi-factor XP calculation with efficiency bonuses
- **AI Task Generation**: Context-aware task suggestions 
- **Settings Screen**: Configurable dungeon mode, streak caps, efficiency slopes
- **Work Sessions**: Pomodoro timers with focus scoring
- **Progress Tracking**: Visual sphere grid with node progression

## 🔐 Security & Production

- All API keys secured in Supabase Edge Functions
- Row Level Security (RLS) on all database tables  
- Rate limiting on AI endpoints
- Input validation and error handling
- No sensitive data in client-side code

Ready for Vercel deployment with green CI/CD builds.
