import { FormEvent, useEffect, useMemo, useState } from 'react';

type Stop = {
  runId: string;
  runName: string;
  runStatus: string;
  stopOrder: number;
  orderId: string;
  orderNumber: string;
  deliveryStatus: string;
  address: { street: string; city: string; state: string; zipCode: string };
  coordinates?: { latitude: number; longitude: number };
  navigationUrl?: string;
  customer?: { firstName?: string; lastName?: string; phone?: string };
  items: Array<{ name: string; quantity: number; variant?: { size?: string; weight?: string; sku?: string } }>;
};

type Run = { id: string; name: string; serviceDate: string; status: string; stops: Stop[] };
type Driver = { firstName: string; lastName: string; email: string };

const API = '/api/v1';
const tokenKey = 'petshiwu_driver_token';

const api = async (path: string, options: RequestInit = {}) => {
  const token = sessionStorage.getItem(tokenKey);
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API}${path}`, { ...options, headers, credentials: 'include' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Something went wrong');
  return payload;
};

const statusLabel: Record<string, string> = {
  ready: 'Ready',
  assigned: 'Assigned',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  failed: 'Needs attention',
  cancelled: 'Cancelled'
};

export function DriverApp() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selected, setSelected] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [proof, setProof] = useState({ image: null as File | null, recipientName: '', handoffMethod: 'handed_to_customer', notes: '' });

  const stops = useMemo(() => runs.flatMap(run => run.stops), [runs]);
  const completed = stops.filter(stop => stop.deliveryStatus === 'delivered').length;

  const loadDay = async () => {
    setLoading(true);
    setError('');
    try {
      const [me, today] = await Promise.all([api('/driver/me'), api('/driver/runs/today')]);
      setDriver(me.data);
      setRuns(today.data || []);
    } catch (err) {
      sessionStorage.removeItem(tokenKey);
      setDriver(null);
      setRuns([]);
      setError(err instanceof Error ? err.message : 'Unable to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem(tokenKey)) void loadDay();
    else setLoading(false);
  }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials), credentials: 'include'
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'Login failed');
      if (payload.data?.role && payload.data.role !== 'driver') throw new Error('This login is not a driver account');
      if (!payload.token) throw new Error('Login did not return a session token');
      sessionStorage.setItem(tokenKey, payload.token);
      await loadDay();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(tokenKey);
    setDriver(null);
    setRuns([]);
    setSelected(null);
  };

  const updateStatus = async (stop: Stop, status: string) => {
    setBusy(true);
    setError('');
    try {
      await api(`/driver/stops/${encodeURIComponent(stop.orderId)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setNotice(`Delivery ${stop.orderNumber} updated`);
      await loadDay();
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update delivery');
    } finally {
      setBusy(false);
    }
  };

  const submitProof = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !proof.image) return setError('Choose a delivery photo first');
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('image', proof.image);
      body.append('recipientName', proof.recipientName);
      body.append('handoffMethod', proof.handoffMethod);
      body.append('notes', proof.notes);
      await api(`/driver/stops/${encodeURIComponent(selected.orderId)}/proof`, { method: 'POST', body });
      setNotice('Proof saved and customer notification queued');
      setProof({ image: null, recipientName: '', handoffMethod: 'handed_to_customer', notes: '' });
      await loadDay();
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save proof');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="mark">P</div><p>Loading your route...</p></div>;

  if (!driver) return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-lockup"><div className="mark">P</div><div><span className="eyebrow">PETSHIWU</span><h1>Driver desk</h1></div></div>
        <p className="lede">Your assigned stops, one calm screen.</p>
        <form onSubmit={login} className="login-form">
          <label>Email<input type="email" inputMode="email" autoComplete="username" value={credentials.email} onChange={event => setCredentials({ ...credentials, email: event.target.value })} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={credentials.password} onChange={event => setCredentials({ ...credentials, password: event.target.value })} required /></label>
          {error && <div className="error-banner">{error}</div>}
          <button className="primary-button" disabled={busy}>{busy ? 'Signing in...' : 'Sign in to route'}</button>
        </form>
        <p className="security-note">Private driver access. This workspace only shows deliveries assigned to your account.</p>
      </section>
    </main>
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup compact"><div className="mark">P</div><div><span className="eyebrow">PETSHIWU</span><strong>Driver desk</strong></div></div>
        <button className="text-button" onClick={logout}>Sign out</button>
      </header>
      <section className="hero">
        <div><span className="eyebrow">TODAY'S ROUTE</span><h1>Good morning, {driver.firstName}.</h1><p>{stops.length ? `${completed} of ${stops.length} stops completed` : 'No stops assigned yet'}</p></div>
        <div className="route-ring"><b>{completed}</b><span>/ {stops.length}</span></div>
      </section>
      {error && <div className="error-banner page-banner">{error}</div>}
      {notice && <button className="notice-banner page-banner" onClick={() => setNotice('')}>{notice} ×</button>}
      {stops.length === 0 ? <section className="empty-card"><div className="empty-icon">✓</div><h2>Nothing assigned today</h2><p>Your dispatcher has not assigned a route for today.</p></section> : (
        <section className="stop-list">
          <div className="section-heading"><div><span className="eyebrow">YOUR STOPS</span><h2>Delivery route</h2></div><span className="date-pill">{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date())}</span></div>
          {stops.map((stop, index) => (
            <button className={`stop-card ${stop.deliveryStatus === 'delivered' ? 'is-done' : ''}`} key={`${stop.runId}-${stop.orderNumber}`} onClick={() => setSelected(stop)}>
              <span className="stop-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="stop-main"><strong>{stop.address.street}</strong><span>{stop.address.city}, {stop.address.state} {stop.address.zipCode}</span><small>{stop.orderNumber} · {stop.items.length} item{stop.items.length === 1 ? '' : 's'}</small></span>
              <span className={`status-dot ${stop.deliveryStatus}`} aria-label={statusLabel[stop.deliveryStatus]}>›</span>
            </button>
          ))}
        </section>
      )}
      {selected && <div className="sheet-backdrop" onClick={() => setSelected(null)}><section className="detail-sheet" onClick={event => event.stopPropagation()}>
        <div className="sheet-handle" /><div className="sheet-head"><div><span className="eyebrow">STOP {String(selected.stopOrder).padStart(2, '0')}</span><h2>{selected.orderNumber}</h2></div><button className="close-button" onClick={() => setSelected(null)}>×</button></div>
        <div className="address-card"><span className="pin">⌖</span><div><strong>{selected.address.street}</strong><span>{selected.address.city}, {selected.address.state} {selected.address.zipCode}</span></div></div>
        {selected.navigationUrl && <a className="nav-button" href={selected.navigationUrl} target="_blank" rel="noreferrer">Open navigation <span>↗</span></a>}
        {selected.customer?.phone && <a className="call-link" href={`tel:${selected.customer.phone}`}>Call customer · {selected.customer.phone}</a>}
        <div className="detail-section"><span className="eyebrow">ITEMS</span>{selected.items.map(item => <div className="item-row" key={`${item.name}-${item.quantity}`}><span>{item.name}{item.variant?.size ? ` · ${item.variant.size}` : ''}</span><b>×{item.quantity}</b></div>)}</div>
        <div className="detail-section"><span className="eyebrow">STATUS</span><div className="status-current">{statusLabel[selected.deliveryStatus] || selected.deliveryStatus}</div>
          {selected.deliveryStatus !== 'delivered' && <div className="action-row">{selected.deliveryStatus !== 'out_for_delivery' && <button className="secondary-button" disabled={busy} onClick={() => updateStatus(selected, 'out_for_delivery')}>Start delivery</button>}{selected.deliveryStatus === 'out_for_delivery' && <button className="secondary-button" disabled={busy} onClick={() => document.getElementById('proof-form')?.scrollIntoView({ behavior: 'smooth' })}>Add proof</button>}</div>}
        </div>
        {selected.deliveryStatus === 'out_for_delivery' && <form id="proof-form" className="proof-form" onSubmit={submitProof}><div className="form-title"><span className="eyebrow">PROOF OF DELIVERY</span><strong>Close this stop</strong></div><label className="photo-picker">{proof.image ? <span>{proof.image.name}</span> : <><b>＋</b><span>Add delivery photo</span></>}<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={event => setProof({ ...proof, image: event.target.files?.[0] || null })} /></label><input placeholder="Recipient name" value={proof.recipientName} onChange={event => setProof({ ...proof, recipientName: event.target.value })} /><select value={proof.handoffMethod} onChange={event => setProof({ ...proof, handoffMethod: event.target.value })}><option value="handed_to_customer">Handed to customer</option><option value="handed_to_household_member">Handed to household member</option><option value="left_at_door">Left at door</option><option value="left_with_doorman">Left with doorman</option><option value="other">Other</option></select><textarea placeholder="Delivery notes (optional)" rows={3} value={proof.notes} onChange={event => setProof({ ...proof, notes: event.target.value })} /><button className="primary-button" disabled={busy || !proof.image}>{busy ? 'Saving proof...' : 'Save proof & mark delivered'}</button></form>}
      </section></div>}
    </main>
  );
}
