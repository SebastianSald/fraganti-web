import { createClient } from "@supabase/supabase-js";

// Estas dos variables se configuran en Vercel (Settings → Environment Variables)
// y en tu archivo .env.local para desarrollo. Ver README para el paso a paso.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // No lanzamos error duro para no romper el build; se ve claro en consola.
  console.error(
    "[Supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. " +
    "Configúralas en Vercel y en tu .env.local (ver README)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
