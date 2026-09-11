import { createClient } from "@supabase/supabase-js";

function requirePublicEnvironment(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL이 필요합니다");
  if (!key) throw new Error("Supabase 브라우저 publishable key가 필요합니다");
  return { url, key };
}

export function createRealtimeClient() {
  const { url, key } = requirePublicEnvironment();
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
