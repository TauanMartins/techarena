export function notifyFeedback(message: string, error = false) {
  window.dispatchEvent(
    new CustomEvent('app-feedback', { detail: { message, error } }),
  );
}
