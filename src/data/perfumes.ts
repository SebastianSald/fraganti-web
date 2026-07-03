// ============================================================================
// Este archivo YA NO contiene el catálogo (para eso está
// /public/data/perfumes.json, que puedes editar con el Editor Visual en
// /admin/editor.html — no requiere tocar código).
//
// Aquí solo quedan: los tipos TypeScript, y las familias olfativas / preguntas
// del quiz, que cambian con mucha menos frecuencia que el catálogo.
// ============================================================================

export interface FragranceNotes {
  salida: string[];
  corazon: string[];
  fondo: string[];
}

export interface Perfume {
  id: number;
  name: string;
  inspiradoEn?: string;
  family: string;
  price: string;
  image: string;
  isNew?: boolean;
  notasCorta: string;
  notas: FragranceNotes;
}

/** Carga el catálogo desde /public/data/perfumes.json en tiempo de ejecución. */
export async function loadPerfumes(): Promise<Perfume[]> {
  const res = await fetch("/data/perfumes.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`No se pudo cargar el catálogo (${res.status})`);
  }
  return res.json();
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
