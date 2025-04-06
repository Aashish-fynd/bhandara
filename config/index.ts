// for testing only
// import dotenv from "dotenv";

// dotenv.config();

const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
    key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""
  }
};

export default Object.freeze(config);
