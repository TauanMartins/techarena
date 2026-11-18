export function notifyFeedback(
  message: string,
  error = false,
  requiresAcknowledgment = error,
) {
  window.dispatchEvent(
    new CustomEvent('app-feedback', {
      detail: { message, error, requiresAcknowledgment },
    }),
  );
}
