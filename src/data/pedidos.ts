import { supabase, supabaseConfigured } from "../lib/supabaseClient";

export type EstadoPedido = "pendiente" | "pago_reportado" | "confirmado" | "enviado" | "cancelado";

export const ESTADO_LABELS: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  pago_reportado: "Pago reportado",
  confirmado: "Pago confirmado",
  enviado: "Enviado",
  cancelado: "Cancelado",
};

export interface ItemPedido {
  nombre: string;
  label: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Pedido {
  id: number;
  referencia: string;
  items: ItemPedido[];
  subtotal: number;
  descuento: number;
  total: number;
  metodo: "whatsapp" | "transferencia";
  metodoPagoNombre?: string; // "Nequi", "Llave Bre-B", etc. — solo si metodo="transferencia"
  cuponCodigo?: string;
  estado: EstadoPedido;
  creadoEn: string;
}

function filaAPedido(row: any): Pedido {
  return {
    id: row.id,
    referencia: row.referencia,
    items: row.items || [],
    subtotal: Number(row.subtotal) || 0,
    descuento: Number(row.descuento) || 0,
    total: Number(row.total) || 0,
    metodo: row.metodo,
    metodoPagoNombre: row.metodo_pago_nombre || undefined,
    cuponCodigo: row.cupon_codigo || undefined,
    estado: row.estado || "pendiente",
    creadoEn: row.created_at,
  };
}

/**
 * Guarda el pedido en Supabase cuando el cliente hace clic en el botón de checkout.
 * Se llama "en segundo plano": si falla (Supabase caído, sin configurar, etc.) NO debe
 * romper el flujo de WhatsApp — el pedido igual le llega a Sebastian por el mensaje.
 * Esta tabla es un respaldo/registro adicional, no la única fuente de verdad del pedido.
 */
export async function crearPedido(p: Omit<Pedido, "id" | "creadoEn" | "estado">): Promise<void> {
  if (!supabaseConfigured || !supabase) return;
  try {
    await supabase.from("pedidos").insert({
      referencia: p.referencia,
      items: p.items,
      subtotal: p.subtotal,
      descuento: p.descuento,
      total: p.total,
      metodo: p.metodo,
      metodo_pago_nombre: p.metodoPagoNombre || null,
      cupon_codigo: p.cuponCodigo || null,
      estado: "pendiente",
    });
  } catch (e) {
    // Silencioso a propósito — ver comentario arriba.
    console.error("[Pedidos] No se pudo guardar el pedido de respaldo:", e);
  }
}

/** Para el panel de admin: todos los pedidos, más recientes primero. */
export async function loadPedidos(): Promise<Pedido[]> {
  if (!supabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(filaAPedido);
}

export async function actualizarEstadoPedido(id: number, estado: EstadoPedido): Promise<void> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase no está configurado todavía.");
  const { error } = await supabase.from("pedidos").update({ estado }).eq("id", id);
  if (error) throw new Error(error.message);
}
