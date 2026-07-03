import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Estas dos variables se configuran en Vercel (Settings → Environment Variables)
// y en tu archivo .env.local para desarrollo. Ver README para el paso a paso.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// IMPORTANTE: esto es la llave "anon" (pública), NO la "service_role".
// La anon key está diseñada para ir en el código del navegador — no da
// acceso de escritura por sí sola, eso lo controla la seguridad de la
// tabla en Supabase (Row Level Security), que solo deja escribir a
// usuarios logueados. Exponerla en el frontend es normal y seguro.

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

if (supabaseConfigured) {
  try {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string);
  } catch (e) {
    // Si la URL está mal escrita, no dejamos que esto tumbe toda la página.
    console.error("[Supabase] No se pudo crear el cliente:", e);
    client = null;
  }
} else {
  console.error(
    "[Supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. " +
    "La tienda mostrará el catálogo de respaldo hasta que se configuren " +
    "en Vercel (Settings → Environment Variables). Ver README."
  );
}

export const supabase = client;
