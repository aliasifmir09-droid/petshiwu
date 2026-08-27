import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

// Do not hide #static-shell here. index.html waits until #root has children.
// Hiding it on the first animation frame left a white page when React was
// still booting or when an idle-logout redirect ran in a background tab.



