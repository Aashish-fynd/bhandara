import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import config from "@/config";
import LargeSecureStorage from "@/features/storage/LargeSecureStorage";

const supabase = createClient(config.supabase.url, config.supabase.key, {
  auth: {
    // storage: new LargeSecureStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export default supabase;
