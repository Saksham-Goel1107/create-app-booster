import { registerSW } from 'virtual:pwa-register';

export function setupPWA() {
  const updateSW = registerSW({
    onNeedRefresh() {
      if (confirm('New content available. Reload?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
  
  return updateSW;
}