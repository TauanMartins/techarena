import { useEffect, useRef, useState } from 'react';
import { ToastNotice } from './ui/ToastNotice';

interface Notification {
  message: string;
  error: boolean;
  requiresAcknowledgment: boolean;
  id: number;
}
/** Queue imperative feedback so important messages cannot be overwritten. */
export function FeedbackNotifications() {
  const [notices, setNotices] = useState<Notification[]>([]);
  const sequence = useRef(0);
  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<Omit<Notification, 'id'>>).detail;
      const notice = { ...detail, id: ++sequence.current };
      setNotices((current) => [...current, notice]);
    };
    window.addEventListener('app-feedback', receive);
    return () => window.removeEventListener('app-feedback', receive);
  }, []);
  const notice = notices[0];
  return notice ? (
    <ToastNotice
      key={notice.id}
      {...notice}
      onClose={() =>
        setNotices((current) => current.filter((item) => item.id !== notice.id))
      }
    />
  ) : null;
}
