import React from 'react';
import { createRoot } from 'react-dom/client';
import { DriverApp } from './DriverApp';
import './styles.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/driver/sw.js').catch(() => undefined));
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DriverApp />
  </React.StrictMode>
);
