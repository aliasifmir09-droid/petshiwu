import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { RETURN_REASONS, buildReturnIntakeMessage, createReturnReference } from '@/utils/returnRequest';
import { useAuthStore } from '@/stores/authStore';

const ReturnRequestForm = () => {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.firstName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [orderNumber, setOrderNumber] = useState('');
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const nextReference = createReturnReference();
    try {
      await api.post(
        '/v1/contact/general',
        {
          name: name.trim(),
          email: email.trim(),
          subject: 'return',
          message: buildReturnIntakeMessage({
            reference: nextReference,
            orderNumber: orderNumber.trim(),
            reason,
            details,
          }),
        },
        { skipAuth: true }
      );
      setReference(nextReference);
    } catch {
      setError('Could not send the request. Email support@petshiwu.com with your order number.');
    } finally {
      setLoading(false);
    }
  };

  if (reference) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6" role="status">
        <h2 className="text-xl font-bold text-emerald-900 mb-2">Return request received</h2>
        <p className="text-emerald-900 mb-3">
          Your reference number is <strong>{reference}</strong>. Save it. We email{' '}
          {email.trim() || 'you'} after we review the order.
        </p>
        <p className="text-sm text-emerald-800">
          Unused items: 365 days from delivery. Opened food, treats, or supplements only if they
          arrived damaged, defective, or incorrect. Photos help — reply to our email with them.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block text-sm font-semibold text-stone-800">
          Name
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full h-11 rounded-xl border border-stone-200 px-3"
            autoComplete="name"
          />
        </label>
        <label className="block text-sm font-semibold text-stone-800">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full h-11 rounded-xl border border-stone-200 px-3"
            autoComplete="email"
          />
        </label>
      </div>
      <label className="block text-sm font-semibold text-stone-800">
        Order number
        <input
          required
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
          placeholder="ORD-…"
          className="mt-1 w-full h-11 rounded-xl border border-stone-200 px-3"
        />
      </label>
      <label className="block text-sm font-semibold text-stone-800">
        Reason
        <select
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1 w-full h-11 rounded-xl border border-stone-200 px-3 bg-white"
        >
          {RETURN_REASONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-stone-800">
        Details (optional)
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
          placeholder="What should we know? Attach photos after we reply."
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold disabled:opacity-60"
      >
        {loading ? 'Sending…' : 'Submit return request'}
      </button>
      <p className="text-xs text-stone-500">
        Guest or signed-in — no account required. Policy:{' '}
        <Link to="/return-policy" className="text-[#1E3A8A] underline">
          365-day returns
        </Link>
        .
      </p>
    </form>
  );
};

export default ReturnRequestForm;
