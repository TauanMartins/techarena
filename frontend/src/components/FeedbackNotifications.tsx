import { useEffect, useState } from 'react';
import { ToastNotice } from './ui/ToastNotice';

/** Imperative feedback for actions that close their originating screen. */
export function FeedbackNotifications() {
  const [notice, setNotice] = useState<{
    message: string;
    error: boolean;
    id: number;
  } | null>(null);
  useEffect(() => {
    const receive = (event: Event) => {
      const { message, error } = (
        event as CustomEvent<{ message: string; error: boolean }>
      ).detail;
      setNotice({ message, error, id: Date.now() });
    };
    window.addEventListener('app-feedback', receive);
    return () => window.removeEventListener('app-feedback', receive);
  }, []);
  return notice ? (
    <ToastNotice
      key={notice.id}
      {...notice}
      onClose={() => setNotice(null)}
    />
  ) : null;
}
