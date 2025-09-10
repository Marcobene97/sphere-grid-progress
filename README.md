# Personal Mastery Grid - Productivity Tracker

A deployment-ready gamified productivity application with secure AI integration, database persistence, and comprehensive XP system.

## 🚀 Deployment Ready Features

✅ **Secure AI Integration**: OpenAI calls via Supabase Edge Functions (no browser API keys)  
✅ **Database Persistence**: Full Supabase integration with RLS policies  
✅ **Production Build**: Optimized for CI/CD deployment  
✅ **Unit Tests**: XP engine and core logic tested  
✅ **Environment Config**: Proper .env setup for deployment  

## 📦 Quick Deploy

1. **Set OpenAI API Key**: Add `OPENAI_API_KEY` in Supabase Edge Function secrets
2. **Database Setup**: SQL migrations included and applied
3. **Environment**: Copy `.env.example` to `.env` with your Supabase details
4. **Deploy**: `npm run build` for production build

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)  
- **AI**: OpenAI GPT-4o-mini (secure server-side calls)
- **Testing**: Vitest unit tests for XP calculations

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
