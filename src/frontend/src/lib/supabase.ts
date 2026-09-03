import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wkmkvejzppwaomuljdzg.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbWt2ZWp6cHB3YW9tdWxqZHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDAzNjUsImV4cCI6MjEwNDAxNjM2NX0.OI6qu3Ws74sH-e1THFUEvMXZ9pJejeojsQVYiCndrCQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
