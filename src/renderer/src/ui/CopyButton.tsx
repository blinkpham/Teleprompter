import { Check, Copy, LoaderCircle, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface CopyOutcome {
  readonly ok: boolean;
  readonly message?: string;
}

interface CopyButtonProps {
  readonly payload: string;
  readonly actionLabel: string;
  readonly successLabel?: string;
  readonly copy: (payload: string) => Promise<CopyOutcome>;
  readonly className?: string;
}

type CopyState = 'idle' | 'pending' | 'success' | 'error';

export function CopyButton({ payload, actionLabel, successLabel = 'Copied', copy, className = '' }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  const [error, setError] = useState('');
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const handleClick = async () => {
    if (state === 'pending') return;
    setState('pending');
    setError('');
    const result = await copy(payload);
    if (result.ok) {
      setState('success');
      timer.current = window.setTimeout(() => setState('idle'), 1800);
    } else {
      setState('error');
      setError(result.message ?? "Couldn't copy.");
    }
  };

  const icon = state === 'pending'
    ? <LoaderCircle className="spin" size={16} aria-hidden="true" />
    : state === 'success'
      ? <Check size={16} aria-hidden="true" />
      : state === 'error'
        ? <RotateCcw size={16} aria-hidden="true" />
        : <Copy size={16} aria-hidden="true" />;
  const label = state === 'success' ? successLabel : state === 'error' ? 'Retry' : actionLabel;

  return (
    <span className={`copy-control ${className}`}>
      <button type="button" className={`copy-button copy-${state}`} onClick={() => void handleClick()} disabled={state === 'pending'} aria-label={label}>
        {icon} <span>{label}</span>
      </button>
      {state === 'error' && <span className="copy-error" role="status">{error}</span>}
    </span>
  );
}
