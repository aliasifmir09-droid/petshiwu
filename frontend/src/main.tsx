import React, { Component, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

/** Catches render crashes so #root still gets children and the splash can hide. */
class BootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1E3A8A' }}>Petshiwu could not load</p>
          <p style={{ color: '#4b5563', maxWidth: 360 }}>The shop hit an error on startup. Reload the page — your cart is saved on this device.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ background: '#1E3A8A', color: '#fff', border: 0, borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BootErrorBoundary>
        <App />
      </BootErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
);

// Do not hide #static-shell here. index.html waits until #root has children.
// Hiding it on the first animation frame left a white page when React was
// still booting or when an idle-logout redirect ran in a background tab.

// Do not hide #static-shell here. index.html waits until #root has children.
// Hiding it on the first animation frame left a white page when React was
// still booting or when an idle-logout redirect ran in a background tab.



