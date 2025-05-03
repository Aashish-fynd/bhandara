import { createClient } from "@supabase/supabase-js";
import config from "@/config";

const supabase = createClient(config.supabase.url, config.supabase.key, {
  auth: {
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

export default supabase;
