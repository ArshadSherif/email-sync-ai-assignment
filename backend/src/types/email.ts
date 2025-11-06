export interface EmailDoc {
  id: string;
  subject?: string;
  text?: string;
  from?: string;
  to?: string;
  date?: string;
  category?: string;
  ai_reply?: {
    text: string;
    generated_at: string;
  };
  [key: string]: any;
}
