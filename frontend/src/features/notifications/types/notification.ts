export interface AppNotification {
  id: string;
  kind: string;
  title: string;
  body: string;
  target_path: string | null;
  created_at: string;
  read_at: string | null;
}
export interface NotificationCursor {
  createdAt: string;
  id: string;
}
