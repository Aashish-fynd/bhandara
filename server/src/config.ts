import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const config = {
  port: process.env.PORT || 3001,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: "30d",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
    folderPath: "ChatifyAPI",
  },
  dbUrl: process.env.DATABASE_URL,
  saltRounds: 10,
  express: {
    fileSizeLimit: "20mb",
  },
  corsOptions: {
    origin: ["http://localhost:8081", "https://editor.swagger.io"],
    optionsSuccessStatus: 200,
    credentials: true,
  },
  log: {
    allLogsPath: "./logs/server.log",
    errorLogsPath: "./logs/error.log",
  },
  supabase: {
    url: process.env.SUPABASE_URL || "",
    key: process.env.SUPABASE_ANON_KEY || "",
  },
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  },
  ip2location: {
    apiKey: process.env.IP2LOCATION_API_KEY || "",
  },
  sessionCookie: {
    keyName: "bh_session",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },
};

export default config;
