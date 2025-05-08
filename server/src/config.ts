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
    origin: ["http://localhost:3000", "https://editor.swagger.io"],
    optionsSuccessStatus: 200,
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
  cookie: {
    keyName: "bh_session",
  },
};

export default config;
