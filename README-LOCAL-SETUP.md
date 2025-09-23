# Local Development Setup

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd sphere-grid-progress
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   The project uses hardcoded Supabase configuration for Lovable. No additional `.env` setup is required.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

- `src/components/` - React components
- `src/pages/` - Page components
- `src/lib/` - Utility functions and services
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions
- `supabase/` - Supabase configuration and functions

## Features

- **Sphere Grid Visualization** - FFX-style node progression system
- **AI Task Generation** - Smart task and node creation
- **XP System** - Gamified progress tracking
- **Supabase Integration** - Real-time data persistence
- **Mobile Support** - Capacitor integration ready

## Troubleshooting

### Common Issues:

1. **Nodes not visible on sphere grid:**
   - Check browser console for Fabric.js errors
   - Ensure canvas is properly initialized
   - Verify node data is loaded correctly

2. **Authentication errors:**
   - The app uses anonymous authentication automatically
   - Check network connectivity to Supabase

3. **Build errors:**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check TypeScript errors: `npm run lint`

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Radix UI
- **Canvas:** Fabric.js v6
- **Backend:** Supabase (Database, Auth, Edge Functions)
- **State:** Zustand, React Query
- **Mobile:** Capacitor (iOS/Android ready)

## Development Tips

- Use the Debug tab in the app to inspect data
- Check browser console for detailed logs
- Use the "Log All Data to Console" button for debugging
- Refresh data using the "Refresh All Data" button

## Mobile Development

For mobile app development with Capacitor, see the mobile development section in the main documentation.