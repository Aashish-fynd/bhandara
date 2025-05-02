// for testing only
// import dotenv from "dotenv";

// dotenv.config();

const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
    key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""
  },
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || ""
  },
  mapbox: {
    accessToken: process.env.MAPBOX_ACCESS_TOKEN || ""
  }
};

export default Object.freeze(config);
