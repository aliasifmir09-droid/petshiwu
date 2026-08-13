import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

function hideStaticShell() {
  const shell = document.getElementById('static-shell');
  if (!shell || shell.classList.contains('ps-fadeout')) return;
  shell.classList.add('ps-fadeout');
  window.setTimeout(() => {
    shell.style.display = 'none';
    shell.setAttribute('aria-hidden', 'true');
  }, 180);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

requestAnimationFrame(hideStaticShell);



