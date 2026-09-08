import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;

const storageBucket =
  process.env.SUPABASE_STORAGE_BUCKET;

if (!supabaseUrl) {
  throw new Error(
    "SUPABASE_URL is not configured"
  );
}

if (!supabaseSecretKey) {
  throw new Error(
    "SUPABASE_SECRET_KEY is not configured"
  );
}

if (!storageBucket) {
  throw new Error(
    "SUPABASE_STORAGE_BUCKET is not configured"
  );
}

export const supabase =
  createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

export const SUPABASE_STORAGE_BUCKET =
  storageBucket;