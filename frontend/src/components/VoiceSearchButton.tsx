import { Mic, MicOff } from 'lucide-react';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';

interface VoiceSearchButtonProps {
  onResult: (transcript: string) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

const VoiceSearchButton = ({ onResult, variant = 'light', className = '' }: VoiceSearchButtonProps) => {
  const { supported, listening, error, toggle } = useVoiceSearch(onResult);

  if (!supported) return null;

  const idleClass =
    variant === 'dark'
      ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
      : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50';

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-label={listening ? 'Stop voice search' : 'Search by voice'}
        aria-pressed={listening}
        title={listening ? 'Listening… tap to stop' : 'Search by voice'}
        className={`p-2 rounded-lg transition-all ${
          listening
            ? 'text-white bg-red-500 shadow-md animate-pulse'
            : idleClass
        }`}
      >
        {listening ? <MicOff size={18} /> : <Mic size={18} />}
      </button>
      {error && (
        <span
          role="status"
          className="absolute left-1/2 top-full z-50 mt-1 w-48 -translate-x-1/2 rounded-lg bg-gray-900 px-2 py-1 text-center text-[11px] text-white shadow-lg"
        >
          {error}
        </span>
      )}
    </span>
  );
};

export default VoiceSearchButton;
