import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.501f2a9d91e14e7f98d4999bc7fe61a9',
  appName: 'sphere-grid-progress',
  webDir: 'dist',
  server: {
    url: 'https://501f2a9d-91e1-4e7f-98d4-999bc7fe61a9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Calendar: {
      writePermissions: true,
      readPermissions: true
    }
  }
};

export default config;