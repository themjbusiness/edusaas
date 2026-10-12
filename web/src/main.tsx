import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './lib/i18n';
import { prefetchForRoute } from './lib/prefetch';
import { registerServiceWorker } from './lib/push';
import { ToastProvider } from './ui';
import './styles.css';

if (window.location.pathname.startsWith('/admin')) {
  document.body.innerHTML = '<div style="font-family:system-ui,-apple-system,sans-serif;padding:3rem;text-align:center;color:#475569;"><h2>Loading EduSaas Super Admin Portal...</h2><p>Redirecting to Django team panel...</p></div>';
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      Promise.all(regs.map((r) => r.unregister())).finally(() => {
        window.location.href = '/admin/';
      });
    });
  } else {
    window.location.href = '/admin/';
  }
} else {
  prefetchForRoute(location.hash);
  registerServiceWorker();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </I18nProvider>
    </StrictMode>,
  );
}
