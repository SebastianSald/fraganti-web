import { supabase, supabaseConfigured } from "../lib/supabaseClient";

export interface Resena {
  id: number;
  autor: string;
  calificacion: number; // 1 a 5
  texto: string;
  fechaTexto: string; // texto libre, ej. "Hace 2 semanas" (tal como lo copias de Google)
  orden: number;
}

function filaAResena(row: any): Resena {
  return {
    id: row.id,
    autor: row.autor,
    calificacion: Number(row.calificacion),
    texto: row.texto || "",
    fechaTexto: row.fecha_texto || "",
    orden: Number(row.orden) || 0,
  };
}

/** Carga las reseñas ordenadas para mostrar en la tienda (más recientes/relevantes primero). */
export async function loadResenas(): Promise<Resena[]> {
  if (!supabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("resenas")
    .select("*")
    .order("orden", { ascending: true })
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(filaAResena);
}

export async function crearResena(r: Omit<Resena, "id">): Promise<Resena> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado todavía.");
  const { data, error } = await supabase
    .from("resenas")
    .insert({ autor: r.autor, calificacion: r.calificacion, texto: r.texto, fecha_texto: r.fechaTexto, orden: r.orden })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return filaAResena(data);
}

export async function actualizarResena(id: number, cambios: Partial<Resena>): Promise<void> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado todavía.");
  const fila: Record<string, any> = {};
  if (cambios.autor !== undefined) fila.autor = cambios.autor;
  if (cambios.calificacion !== undefined) fila.calificacion = cambios.calificacion;
  if (cambios.texto !== undefined) fila.texto = cambios.texto;
  if (cambios.fechaTexto !== undefined) fila.fecha_texto = cambios.fechaTexto;
  if (cambios.orden !== undefined) fila.orden = cambios.orden;
  const { error } = await supabase.from("resenas").update(fila).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function eliminarResena(id: number): Promise<void> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado todavía.");
  const { error } = await supabase.from("resenas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Promedio de calificación (redondeado a 1 decimal) y total de reseñas — para el resumen tipo "4.9 ★ (32 reseñas)". */
export function resumenResenas(resenas: Resena[]): { promedio: number; total: number } {
  if (resenas.length === 0) return { promedio: 0, total: 0 };
  const suma = resenas.reduce((acc, r) => acc + r.calificacion, 0);
  return { promedio: Math.round((suma / resenas.length) * 10) / 10, total: resenas.length };
}
