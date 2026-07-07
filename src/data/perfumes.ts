// ============================================================================
// El catálogo ahora vive en Supabase (tabla "perfumes"), con stock en vivo.
// Este archivo mantiene el mismo tipo `Perfume` que ya usan Landing.tsx y
// QuickViewModal.tsx, así que esos componentes no necesitaron cambiar.
// El admin visual ahora está en /admin (AdminPanel.tsx), protegido con login.
// ============================================================================

import { supabase, supabaseConfigured } from "../lib/supabaseClient";

export interface FragranceNotes {
  salida: string[];
  corazon: string[];
  fondo: string[];
}

/** Los decants tienen tamaño fijo. El frasco completo puede tener varios tamaños (ver TamanoCompleto). */
export type FormatoDecantKey = "decant5" | "decant10";

export interface FormatoInfo {
  /** Si el negocio ofrece este perfume en este formato (aunque esté agotado). */
  disponible: boolean;
  /** Precio actual (el que se cobra), en texto, ej. "$195.000". */
  precio: string;
  /**
   * Precio antes del descuento (opcional). Si está lleno y es mayor al
   * precio actual, el formato se muestra "en oferta": el precio anterior
   * tachado y el actual resaltado. Déjalo vacío si no hay descuento.
   */
  precioAntes?: string;
  /** Unidades en stock. 0 = agotado (pero sigue mostrándose si disponible=true). */
  stock: number;
}

/**
 * Un tamaño de frasco completo (ej. 100ml, 200ml). Un perfume puede tener
 * varios — cada uno con su propio precio y stock — o solo uno.
 */
export interface TamanoCompleto extends FormatoInfo {
  /** Identificador estable (no cambia aunque se edite el precio o el ml). */
  id: string;
  /** Mililitros del frasco, ej. 100. 0 = "tamaño único" (no se muestra el ml). */
  ml: number;
}

/** Para quién está pensado el perfume — se usa como filtro en la tienda. */
export type Genero = "Masculino" | "Femenino" | "Unisex";

export const GENEROS_CATALOGO: Genero[] = ["Masculino", "Femenino", "Unisex"];

export interface Perfume {
  id: number;
  name: string;
  inspiradoEn?: string;
  family: string;
  genero: Genero;
  image: string;
  /**
   * Foto opcional de la botella/decant ABIERTO. Si existe, se muestra en vez
   * de `image` cuando el cliente selecciona un decant (5ml o 10ml).
   */
  imagenAbierta?: string;
  isNew?: boolean;
  notasCorta: string;
  notas: FragranceNotes;
  formatos: {
    completo: { tamanos: TamanoCompleto[] };
    decant5: FormatoInfo;
    decant10: FormatoInfo;
  };
}

export const DECANT_KEYS: FormatoDecantKey[] = ["decant5", "decant10"];

export const FORMATO_LABELS: Record<FormatoDecantKey, string> = {
  decant5: "Decant 5ml",
  decant10: "Decant 10ml",
};

const FORMATOS_VACIOS = {
  completo: { tamanos: [] as TamanoCompleto[] },
  decant5: { disponible: false, precio: "", precioAntes: "", stock: 0 },
  decant10: { disponible: false, precio: "", precioAntes: "", stock: 0 },
};

/** Genera un id corto y estable para un tamaño nuevo. */
export function generarIdTamano(): string {
  return Math.random().toString(36).slice(2, 9);
}

/** Una opción de compra "aplanada" — ya sea un tamaño de frasco completo o un decant. */
export interface Variante {
  /** "completo:<id>" para frascos, o "decant5"/"decant10" para decants. */
  id: string;
  label: string;
  info: FormatoInfo;
  esDecant: boolean;
}

/** Texto a mostrar para un tamaño de frasco completo, ej. "100ml" o "Frasco completo". */
export function labelTamano(t: TamanoCompleto): string {
  return t.ml > 0 ? `${t.ml}ml` : "Frasco completo";
}

/** true si este formato/tamaño tiene un precio anterior mayor al actual (está en oferta). */
export function formatoEnOferta(info: FormatoInfo): boolean {
  if (!info.precioAntes) return false;
  const antes = parsePrecioCOPLocal(info.precioAntes);
  const ahora = parsePrecioCOPLocal(info.precio);
  return antes > 0 && ahora > 0 && antes > ahora;
}

/** Porcentaje de descuento redondeado, ej. 25 para "-25%". Null si no aplica. */
export function porcentajeDescuento(info: FormatoInfo): number | null {
  if (!formatoEnOferta(info)) return null;
  const antes = parsePrecioCOPLocal(info.precioAntes!);
  const ahora = parsePrecioCOPLocal(info.precio);
  return Math.round(((antes - ahora) / antes) * 100);
}

// Copia local mínima de parsePrecioCOP (la "oficial" vive en CartContext.tsx,
// pero este archivo no debe importar de un componente para evitar dependencias
// circulares — es una función de una línea, se mantiene igual en ambos lados).
function parsePrecioCOPLocal(texto: string): number {
  const soloDigitos = (texto || "").replace(/[^\d]/g, "");
  return soloDigitos ? parseInt(soloDigitos, 10) : 0;
}

/**
 * Todas las variantes (tamaños de frasco completo + decants) que el negocio
 * ofrece para este perfume (disponible=true), en orden fijo: primero los
 * tamaños de frasco completo (en el orden en que están guardados), luego
 * decant 5ml y decant 10ml.
 */
export function variantesOfrecidas(p: Perfume): Variante[] {
  const variantes: Variante[] = [];
  const tamanos = p.formatos?.completo?.tamanos || [];
  for (const t of tamanos) {
    if (t.disponible) variantes.push({ id: `completo:${t.id}`, label: labelTamano(t), info: t, esDecant: false });
  }
  for (const k of DECANT_KEYS) {
    const info = p.formatos?.[k];
    if (info?.disponible) variantes.push({ id: k, label: FORMATO_LABELS[k], info, esDecant: true });
  }
  return variantes;
}

/** Busca una variante ofrecida por su id (ej. "completo:abc123" o "decant5"). */
export function obtenerVariante(p: Perfume, varianteId: string): Variante | null {
  return variantesOfrecidas(p).find((v) => v.id === varianteId) ?? null;
}

/** true si el perfume tiene AL MENOS una variante ofrecida en oferta. */
export function perfumeEnOferta(p: Perfume): boolean {
  return variantesOfrecidas(p).some((v) => formatoEnOferta(v.info));
}

/** true si el perfume no tiene NINGUNA variante ofrecida con stock > 0. */
export function perfumeAgotado(p: Perfume): boolean {
  const variantes = variantesOfrecidas(p);
  if (variantes.length === 0) return true;
  return variantes.every((v) => v.info.stock <= 0);
}

/** La primera variante ofrecida con stock disponible (para preseleccionar en la UI). */
export function primeraVarianteDisponible(p: Perfume): Variante | null {
  const variantes = variantesOfrecidas(p);
  const conStock = variantes.find((v) => v.info.stock > 0);
  return conStock ?? variantes[0] ?? null;
}

// ----------------------------------------------------------------------------
// Mapeo entre las columnas de Supabase (snake_case) y el tipo Perfume del
// front (camelCase). Todo el resto de la app sigue usando `Perfume` igual
// que antes — solo este archivo sabe que la fuente de datos es Supabase.
// ----------------------------------------------------------------------------

/**
 * Convierte cualquier forma antigua o nueva de `formatos.completo` al
 * esquema actual `{ tamanos: TamanoCompleto[] }`. Esto permite que perfumes
 * guardados ANTES de agregar el soporte multi-tamaño (una sola forma con
 * disponible/precio/stock) sigan funcionando sin tener que migrar la base
 * de datos a mano — se normalizan solos la próxima vez que se leen, y quedan
 * en el formato nuevo apenas se guarden desde el admin.
 */
function normalizarCompleto(raw: any): { tamanos: TamanoCompleto[] } {
  if (!raw) return { tamanos: [] };
  if (Array.isArray(raw.tamanos)) {
    return { tamanos: raw.tamanos.map((t: any) => ({ ...t, id: t.id || generarIdTamano() })) };
  }
  // Forma antigua: { disponible, precio, precioAntes, stock } sin tamaños.
  if ("disponible" in raw || "precio" in raw) {
    return {
      tamanos: [
        {
          id: generarIdTamano(),
          ml: 0,
          disponible: !!raw.disponible,
          precio: raw.precio || "",
          precioAntes: raw.precioAntes || "",
          stock: Number(raw.stock) || 0,
        },
      ],
    };
  }
  return { tamanos: [] };
}

/** Resuelve la ruta a mostrar de una imagen: URL completa (Cloudinary, etc.) tal cual, o archivo local en /images/. */
export function resolverImagen(ruta?: string | null): string {
  if (!ruta) return "";
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `/images/${ruta}`;
}

function filaASupaPerfume(row: any): Perfume {
  return {
    id: row.id,
    name: row.name,
    inspiradoEn: row.inspirado_en || "",
    family: row.family,
    genero: row.genero || "Unisex",
    image: row.image,
    imagenAbierta: row.imagen_abierta || "",
    isNew: !!row.is_new,
    notasCorta: row.notas_corta || "",
    notas: row.notas || { salida: [], corazon: [], fondo: [] },
    formatos: {
      completo: normalizarCompleto(row.formatos?.completo),
      decant5: row.formatos?.decant5 || FORMATOS_VACIOS.decant5,
      decant10: row.formatos?.decant10 || FORMATOS_VACIOS.decant10,
    },
  };
}

function perfumeAFila(p: Partial<Perfume>) {
  const fila: Record<string, any> = {};
  if (p.name !== undefined) fila.name = p.name;
  if (p.inspiradoEn !== undefined) fila.inspirado_en = p.inspiradoEn;
  if (p.family !== undefined) fila.family = p.family;
  if (p.genero !== undefined) fila.genero = p.genero;
  if (p.image !== undefined) fila.image = p.image;
  if (p.imagenAbierta !== undefined) fila.imagen_abierta = p.imagenAbierta;
  if (p.isNew !== undefined) fila.is_new = p.isNew;
  if (p.notasCorta !== undefined) fila.notas_corta = p.notasCorta;
  if (p.notas !== undefined) fila.notas = p.notas;
  if (p.formatos !== undefined) fila.formatos = p.formatos;
  return fila;
}

/** Respaldo: carga desde el JSON estático si Supabase no está disponible. */
async function cargarDesdeRespaldo(): Promise<Perfume[]> {
  const res = await fetch("/data/perfumes.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Tampoco se pudo cargar el respaldo (${res.status})`);
  const data = await res.json();
  return data.map((item: any) => ({
    ...item,
    genero: item.genero || "Unisex",
    imagenAbierta: item.imagenAbierta || "",
    formatos: {
      completo: normalizarCompleto(item.formatos?.completo),
      decant5: item.formatos?.decant5 || FORMATOS_VACIOS.decant5,
      decant10: item.formatos?.decant10 || FORMATOS_VACIOS.decant10,
    },
  }));
}

/**
 * Carga el catálogo completo. Intenta Supabase primero (stock en vivo);
 * si Supabase no está configurado o falla, cae automáticamente al
 * catálogo de respaldo en /public/data/perfumes.json, para que la tienda
 * NUNCA se quede en blanco por un problema de base de datos.
 */
export async function loadPerfumes(): Promise<Perfume[]> {
  if (supabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("perfumes").select("*").order("id", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data.map(filaASupaPerfume);
    } catch (e) {
      console.error("[Supabase] Error cargando catálogo, usando respaldo:", e);
    }
  }
  return cargarDesdeRespaldo();
}

/** Actualiza un perfume existente (requiere sesión de admin por RLS). */
export async function actualizarPerfume(id: number, cambios: Partial<Perfume>): Promise<void> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado todavía (ver README).");
  const { error } = await supabase.from("perfumes").update(perfumeAFila(cambios)).eq("id", id);
  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
}

/** Crea un perfume nuevo (requiere sesión de admin por RLS). Devuelve el perfume creado con su id. */
export async function crearPerfume(p: Omit<Perfume, "id">): Promise<Perfume> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado todavía (ver README).");
  const { data, error } = await supabase.from("perfumes").insert(perfumeAFila(p)).select().single();
  if (error) throw new Error(`No se pudo crear el perfume: ${error.message}`);
  return filaASupaPerfume(data);
}

/** Elimina un perfume (requiere sesión de admin por RLS). */
export async function eliminarPerfume(id: number): Promise<void> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado todavía (ver README).");
  const { error } = await supabase.from("perfumes").delete().eq("id", id);
  if (error) throw new Error(`No se pudo eliminar: ${error.message}`);
}

export function nuevoPerfumeVacio(): Omit<Perfume, "id"> {
  return {
    name: "",
    inspiradoEn: "",
    family: "Floral",
    genero: "Unisex",
    image: "",
    imagenAbierta: "",
    isNew: false,
    notasCorta: "",
    notas: { salida: [], corazon: [], fondo: [] },
    formatos: JSON.parse(JSON.stringify(FORMATOS_VACIOS)),
  };
}

/** Un tamaño de frasco completo nuevo y vacío, listo para editar en el admin. */
export function nuevoTamanoVacio(): TamanoCompleto {
  return { id: generarIdTamano(), ml: 100, disponible: true, precio: "", precioAntes: "", stock: 0 };
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

/**
 * Cada opción del test suma puntos a una o más familias olfativas REALES
 * de tu catálogo (las mismas que usas en `family` al cargar un perfume).
 * Al final se suman los puntos de las 4 respuestas y se recomienda un
 * perfume de verdad de tu catálogo — nunca un nombre inventado.
 */
export interface QuizOption {
  label: string;
  pesos: Partial<Record<string, number>>;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "¿Cómo describes tu estilo?",
    options: [
      { label: "Elegante", pesos: { Amaderada: 2, Oriental: 1 } },
      { label: "Casual", pesos: { Fresca: 2, Cítrica: 1 } },
      { label: "Atrevido", pesos: { Oriental: 2, Amaderada: 1 } },
      { label: "Romántico", pesos: { Floral: 2, "Floral Oriental": 1 } },
    ],
  },
  {
    question: "¿Qué momento describe tu uso ideal?",
    options: [
      { label: "Cita romántica", pesos: { Floral: 2, "Floral Oriental": 1 } },
      { label: "Reunión de trabajo", pesos: { Amaderada: 2, Chipre: 1 } },
      { label: "Fiesta", pesos: { Oriental: 2, Gourmand: 1 } },
      { label: "Día casual", pesos: { Fresca: 2, Cítrica: 1 } },
    ],
  },
  {
    question: "¿Qué sensación buscas transmitir?",
    options: [
      { label: "Fresco y limpio", pesos: { Fresca: 2, Cítrica: 2 } },
      { label: "Cálido y sensual", pesos: { Oriental: 2, Gourmand: 1 } },
      { label: "Misterioso", pesos: { Amaderada: 2, Chipre: 1 } },
      { label: "Energizante", pesos: { Cítrica: 2, Fresca: 1 } },
    ],
  },
  {
    question: "¿Qué nota olfativa prefieres?",
    options: [
      { label: "Floral", pesos: { Floral: 3 } },
      { label: "Oriental", pesos: { Oriental: 3 } },
      { label: "Cítrico", pesos: { Cítrica: 3 } },
      { label: "Amaderado", pesos: { Amaderada: 3 } },
    ],
  },
];

/**
 * Suma los puntos de las respuestas elegidas y devuelve el perfume real del
 * catálogo que mejor encaja. Si hay empate, prefiere uno que SÍ tenga stock
 * disponible en algún formato (para no recomendar algo agotado), y entre
 * esos, el más nuevo.
 */
export function calcularMatchDelQuiz(respuestas: QuizOption[], productos: Perfume[]): Perfume | null {
  if (productos.length === 0) return null;

  const puntosPorFamilia: Record<string, number> = {};
  for (const r of respuestas) {
    for (const [familia, puntos] of Object.entries(r.pesos)) {
      puntosPorFamilia[familia] = (puntosPorFamilia[familia] || 0) + (puntos || 0);
    }
  }

  let mejorPuntaje = -1;
  let candidatos: Perfume[] = [];
  for (const p of productos) {
    const puntaje = puntosPorFamilia[p.family] || 0;
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      candidatos = [p];
    } else if (puntaje === mejorPuntaje) {
      candidatos.push(p);
    }
  }

  // Si nadie tuvo puntos (catálogo con familias distintas a las del test),
  // simplemente no hay preferencia clara — cualquier candidato sirve como base.
  const conStock = candidatos.filter((p) => !perfumeAgotado(p));
  const pool = conStock.length > 0 ? conStock : candidatos;

  const nuevos = pool.filter((p) => p.isNew);
  const elegido = nuevos[0] || pool[0];
  return elegido || null;
}
