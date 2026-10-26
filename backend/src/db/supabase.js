import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Force IPv4 on Windows to prevent network timeouts / fetch failed
dns.setDefaultResultOrder?.("ipv4first");

// Ensure .env is loaded regardless of whether process runs from root or backend/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config(); // fallback to current cwd

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-project-id")) {
  console.warn(
    "[Supabase DB] ⚠️ SUPABASE_URL or keys are missing or using placeholders in .env.\n" +
    "Database operations will be mocked or will fail until real keys are provided."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
