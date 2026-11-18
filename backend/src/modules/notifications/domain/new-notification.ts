/** Trusted producers supply a stable event key, reused on retries for each recipient. */
export interface NewNotification {
  recipientId: string;
  eventKey: string;
  kind: string;
  title: string;
  body: string;
  targetPath?: string;
}
