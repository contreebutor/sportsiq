import { createClient } from "@supabase/supabase-js";
import { config } from "../config";

const { url, key } = config.supabase;

export const supabase = createClient(url, key);
