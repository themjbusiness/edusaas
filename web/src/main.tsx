import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './lib/i18n';
import { prefetchForRoute } from './lib/prefetch';
import { registerServiceWorker } from './lib/push';
import { ToastProvider } from './ui';
import './styles.css';

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
