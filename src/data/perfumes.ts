// ============================================================================
// El catálogo ahora vive en Supabase (tabla "perfumes"), con stock en vivo.
// Este archivo mantiene el mismo tipo `Perfume` que ya usan Landing.tsx y
// QuickViewModal.tsx, así que esos componentes no necesitaron cambiar.
// El admin visual ahora está en /admin (AdminPanel.tsx), protegido con login.
// ============================================================================

import { supabase } from "../lib/supabaseClient";

export interface FragranceNotes {
  salida: string[];
  corazon: string[];
  fondo: string[];
}

/** Las tres formas en que se puede vender un perfume. */
export type FormatoKey = "completo" | "decant5" | "decant10";

export interface FormatoInfo {
  /** Si el negocio ofrece este perfume en este formato (aunque esté agotado). */
  disponible: boolean;
  /** Precio en texto, ej. "$195.000". */
  precio: string;
  /** Unidades en stock. 0 = agotado (pero sigue mostrándose si disponible=true). */
  stock: number;
}

export interface Perfume {
  id: number;
  name: string;
  inspiradoEn?: string;
  family: string;
  image: string;
  isNew?: boolean;
  notasCorta: string;
  notas: FragranceNotes;
  formatos: {
    completo: FormatoInfo;
    decant5: FormatoInfo;
    decant10: FormatoInfo;
  };
}

export const FORMATO_ORDEN: FormatoKey[] = ["completo", "decant5", "decant10"];

export const FORMATO_LABELS: Record<FormatoKey, string> = {
  completo: "Frasco completo",
  decant5: "Decant 5ml",
  decant10: "Decant 10ml",
};

const FORMATOS_VACIOS = {
  completo: { disponible: true, precio: "", stock: 0 },
  decant5: { disponible: false, precio: "", stock: 0 },
  decant10: { disponible: false, precio: "", stock: 0 },
};

/** Formatos que el negocio ofrece para este perfume (disponible=true), en orden fijo. */
export function formatosOfrecidos(p: Perfume): FormatoKey[] {
  return FORMATO_ORDEN.filter((k) => p.formatos?.[k]?.disponible);
}

/** true si el perfume no tiene NINGÚN formato ofrecido con stock > 0. */
export function perfumeAgotado(p: Perfume): boolean {
  const ofrecidos = formatosOfrecidos(p);
  if (ofrecidos.length === 0) return true;
  return ofrecidos.every((k) => p.formatos[k].stock <= 0);
}

/** El primer formato ofrecido con stock disponible (para preseleccionar en la UI). */
export function primerFormatoDisponible(p: Perfume): FormatoKey | null {
  const ofrecidos = formatosOfrecidos(p);
  const conStock = ofrecidos.find((k) => p.formatos[k].stock > 0);
  return conStock ?? ofrecidos[0] ?? null;
}

// ----------------------------------------------------------------------------
// Mapeo entre las columnas de Supabase (snake_case) y el tipo Perfume del
// front (camelCase). Todo el resto de la app sigue usando `Perfume` igual
// que antes — solo este archivo sabe que la fuente de datos es Supabase.
// ----------------------------------------------------------------------------

function filaASupaPerfume(row: any): Perfume {
  return {
    id: row.id,
    name: row.name,
    inspiradoEn: row.inspirado_en || "",
    family: row.family,
    image: row.image,
    isNew: !!row.is_new,
    notasCorta: row.notas_corta || "",
    notas: row.notas || { salida: [], corazon: [], fondo: [] },
    formatos: row.formatos || FORMATOS_VACIOS,
  };
}

function perfumeAFila(p: Partial<Perfume>) {
  const fila: Record<string, any> = {};
  if (p.name !== undefined) fila.name = p.name;
  if (p.inspiradoEn !== undefined) fila.inspirado_en = p.inspiradoEn;
  if (p.family !== undefined) fila.family = p.family;
  if (p.image !== undefined) fila.image = p.image;
  if (p.isNew !== undefined) fila.is_new = p.isNew;
  if (p.notasCorta !== undefined) fila.notas_corta = p.notasCorta;
  if (p.notas !== undefined) fila.notas = p.notas;
  if (p.formatos !== undefined) fila.formatos = p.formatos;
  return fila;
}

/** Carga el catálogo completo desde Supabase, ordenado por id. */
export async function loadPerfumes(): Promise<Perfume[]> {
  const { data, error } = await supabase.from("perfumes").select("*").order("id", { ascending: true });
  if (error) {
    throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
  }
  return (data || []).map(filaASupaPerfume);
}

/** Actualiza un perfume existente (requiere sesión de admin por RLS). */
export async function actualizarPerfume(id: number, cambios: Partial<Perfume>): Promise<void> {
  const { error } = await supabase.from("perfumes").update(perfumeAFila(cambios)).eq("id", id);
  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
}

/** Crea un perfume nuevo (requiere sesión de admin por RLS). Devuelve el perfume creado con su id. */
export async function crearPerfume(p: Omit<Perfume, "id">): Promise<Perfume> {
  const { data, error } = await supabase.from("perfumes").insert(perfumeAFila(p)).select().single();
  if (error) throw new Error(`No se pudo crear el perfume: ${error.message}`);
  return filaASupaPerfume(data);
}

/** Elimina un perfume (requiere sesión de admin por RLS). */
export async function eliminarPerfume(id: number): Promise<void> {
  const { error } = await supabase.from("perfumes").delete().eq("id", id);
  if (error) throw new Error(`No se pudo eliminar: ${error.message}`);
}

export function nuevoPerfumeVacio(): Omit<Perfume, "id"> {
  return {
    name: "",
    inspiradoEn: "",
    family: "Floral",
    image: "",
    isNew: false,
    notasCorta: "",
    notas: { salida: [], corazon: [], fondo: [] },
    formatos: JSON.parse(JSON.stringify(FORMATOS_VACIOS)),
  };
}

export interface OlfactoryFamily {
  name: string;
  notes: string;
}

export const FAMILIES: OlfactoryFamily[] = [
  { name: "Floral", notes: "Rosa, Jazmín, Peonía" },
  { name: "Amaderado", notes: "Cedro, Sándalo, Vetiver" },
  { name: "Cítrico", notes: "Bergamota, Pomelo, Limón" },
  { name: "Oriental", notes: "Oud, Ámbar, Incienso" },
];

export const FAMILIAS_CATALOGO = [
  "Floral", "Oriental", "Amaderada", "Fresca", "Cítrica", "Floral Oriental", "Chipre", "Gourmand",
];

export const QUIZ_QUESTIONS = [
  {
    question: "¿Cómo describes tu estilo?",
    options: ["Elegante", "Casual", "Atrevido", "Romántico"],
  },
  {
    question: "¿Qué momento describe tu uso ideal?",
    options: ["Cita romántica", "Reunión de trabajo", "Fiesta", "Día casual"],
  },
  {
    question: "¿Qué sensación buscas transmitir?",
    options: ["Fresco y limpio", "Cálido y sensual", "Misterioso", "Energizante"],
  },
  {
    question: "¿Qué nota olfativa prefieres?",
    options: ["Floral", "Oriental", "Cítrico", "Amaderado"],
  },
];
