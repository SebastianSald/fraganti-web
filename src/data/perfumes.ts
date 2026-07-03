// ============================================================================
// Este archivo YA NO contiene el catálogo (para eso está
// /public/data/perfumes.json, que puedes editar con el Editor Visual en
// /admin/editor.html — no requiere tocar código).
//
// Aquí solo quedan: los tipos TypeScript, las utilidades de formatos/stock,
// y las familias olfativas / preguntas del quiz, que cambian con mucha
// menos frecuencia que el catálogo.
// ============================================================================

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

/**
 * Carga el catálogo desde /public/data/perfumes.json en tiempo de ejecución.
 * Si algún perfume viene en el formato antiguo (con "price" plano, sin
 * "formatos"), lo migra automáticamente en memoria para que nunca se rompa
 * la página aunque el JSON no esté actualizado todavía.
 */
export async function loadPerfumes(): Promise<Perfume[]> {
  const res = await fetch("/data/perfumes.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`No se pudo cargar el catálogo (${res.status})`);
  }
  const data = await res.json();
  return data.map((item: any) => {
    if (item.formatos) return item as Perfume;
    // Migración automática desde el esquema antiguo (price plano).
    const { price, ...rest } = item;
    return {
      ...rest,
      formatos: {
        completo: { disponible: true, precio: price || "", stock: 5 },
        decant5: { disponible: false, precio: "", stock: 0 },
        decant10: { disponible: false, precio: "", stock: 0 },
      },
    } as Perfume;
  });
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
