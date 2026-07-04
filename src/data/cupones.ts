import { supabase, supabaseConfigured } from "../lib/supabaseClient";

export type TipoCupon = "porcentaje" | "fijo";

export interface Cupon {
  id: number;
  codigo: string;
  tipo: TipoCupon;
  valor: number;
  activo: boolean;
}

function filaACupon(row: any): Cupon {
  return { id: row.id, codigo: row.codigo, tipo: row.tipo, valor: Number(row.valor), activo: !!row.activo };
}

export async function loadCupones(): Promise<Cupon[]> {
  if (!supabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from("cupones").select("*").order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(filaACupon);
}

/** Busca un cupón por código (sin distinguir mayúsculas) y valida que exista y esté activo. */
export async function buscarCuponPorCodigo(codigo: string): Promise<Cupon | null> {
  if (!supabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from("cupones")
    .select("*")
    .ilike("codigo", codigo.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? filaACupon(data) : null;
}

export async function crearCupon(c: Omit<Cupon, "id">): Promise<Cupon> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado todavía.");
  const { data, error } = await supabase
    .from("cupones")
    .insert({ codigo: c.codigo.trim().toUpperCase(), tipo: c.tipo, valor: c.valor, activo: c.activo })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return filaACupon(data);
}

export async function actualizarCupon(id: number, cambios: Partial<Cupon>): Promise<void> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado todavía.");
  const fila: Record<string, any> = {};
  if (cambios.codigo !== undefined) fila.codigo = cambios.codigo.trim().toUpperCase();
  if (cambios.tipo !== undefined) fila.tipo = cambios.tipo;
  if (cambios.valor !== undefined) fila.valor = cambios.valor;
  if (cambios.activo !== undefined) fila.activo = cambios.activo;
  const { error } = await supabase.from("cupones").update(fila).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function eliminarCupon(id: number): Promise<void> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado todavía.");
  const { error } = await supabase.from("cupones").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Calcula el descuento en pesos que aplica un cupón sobre un subtotal dado. */
export function calcularDescuento(cupon: Cupon, subtotal: number): number {
  if (!cupon.activo) return 0;
  const descuento = cupon.tipo === "porcentaje" ? subtotal * (cupon.valor / 100) : cupon.valor;
  return Math.min(Math.max(0, Math.round(descuento)), subtotal);
}
