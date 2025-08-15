export type Entry = {
    id: number;
    content: string;
    mood: number | null;
    created_at: string;
  };
  
  export type LoginResponse = { access_token: string; refresh_token?: string; };
  export type ChatReply = { answer: string; };