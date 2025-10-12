export type Entry = {
  id: number;
  title?: string;
  content: string;
  mood: number | null;
  created_at: string; // ISO
};

export type LoginResponse = { access_token: string; refresh_token?: string; };

export type ChatbotResponse = {
  thread_id: string;
  reply: string;
};

export type CreateEntryDTO = {
  title?: string;
  content: string;
};

export type UserProfile = {
  username: string;
  email: string;
  display_name?: string;
  status?: string;
  created_at?: string;
  last_login_at?: string | null;
  settings?: {
    tz_iana?: string;
    weekly_summary_day?: number;
    email_opt_in?: boolean;
    reminder_hour?: number; // aggiunto lato client per compatibilità
    weekly_last_sent_at_utc?: string | null;
    created_at?: string;
    updated_at?: string | null;
  };
};