import { useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, Tag, Copy, Check, ShieldCheck, Truck, MessageCircle, Landmark } from "lucide-react";
import { useCart, formatearCOP } from "../context/CartContext";
import { resolverImagen } from "../data/perfumes";
import { METODOS_PAGO } from "../data/pagos";
import { crearPedido } from "../data/pedidos";

type MetodoCheckout = "whatsapp" | "transferencia";

/**
 * Referencia corta de pedido (ej. "FR-8K2QZ"). Se genera una vez por visita y viaja
 * en el mensaje de WhatsApp. Hoy es solo para que el cliente y tú tengan un mismo
 * número al hablar — pero es el mismo tipo de dato que un bot de WhatsApp (el
 * próximo proyecto) necesitaría para identificar el pedido automáticamente y
 * cruzarlo con el comprobante, así que se deja desde ya con ese formato en mente.
 */
function generarReferenciaPedido(): string {
  return `FR-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber: string; // formato "+573242695225"
}

function construirMensajeWhatsApp(
  items: ReturnType<typeof useCart>["items"],
  subtotal: number,
  cuponCodigo: string | undefined,
  descuento: number,
  total: number,
  metodo: MetodoCheckout,
  referencia: string
): string {
  const lineas = items.map(
    (i) => `*${i.nombre}*\n${i.label} — ${formatearCOP(i.precioUnitario * i.cantidad)}${i.cantidad > 1 ? ` (x${i.cantidad})` : ""}`
  );

  const divisor = "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄";

  let mensaje = `🤍 *FRAGANTI* — Nuevo pedido\nRef. *${referencia}*\n\n${lineas.join("\n\n")}\n\n${divisor}\nSubtotal: ${formatearCOP(subtotal)}`;

  if (cuponCodigo && descuento > 0) {
    mensaje += `\nCupón ${cuponCodigo.toUpperCase()}: -${formatearCOP(descuento)}`;
  }

  mensaje += `\n*Total: ${formatearCOP(total)}*\n${divisor}\n\n`;
  mensaje += metodo === "transferencia"
    ? "Ya realicé el pago por transferencia ✓ — adjunto el comprobante en este chat.\nQuedo atento(a) para coordinar el envío. ¡Gracias!"
    : "Quedo atento(a) para coordinar el pago y el envío. ¡Gracias!";
  return mensaje;
}

export function CartDrawer({ isOpen, onClose, whatsappNumber }: CartDrawerProps) {
  const {
    items, cantidadTotal, subtotal, cupon, descuento, total, cuponError, cuponCargando,
    removeFromCart, setCantidad, clearCart, aplicarCupon, quitarCupon,
  } = useCart();
  const [codigoInput, setCodigoInput] = useState("");
  const [metodo, setMetodo] = useState<MetodoCheckout>("whatsapp");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [referencia] = useState(generarReferenciaPedido);
  const hayMetodosPago = METODOS_PAGO.length > 0;

  if (!isOpen) return null;

  const numeroLimpio = whatsappNumber.replace(/[^\d]/g, "");
  const vacio = items.length === 0;

  const handleAplicarCupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await aplicarCupon(codigoInput);
  };

  const copiarNumero = (id: string, numero: string) => {
    navigator.clipboard?.writeText(numero.replace(/\s/g, "")).then(() => {
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 1800);
    });
  };

  const handleCheckout = () => {
    const mensaje = construirMensajeWhatsApp(items, subtotal, cupon?.codigo, descuento, total, metodo, referencia);
    const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    // Se guarda en segundo plano — si falla, no interrumpe el checkout (el pedido ya se envió por WhatsApp).
    crearPedido({
      referencia,
      items: items.map((i) => ({ nombre: i.nombre, label: i.label, cantidad: i.cantidad, precioUnitario: i.precioUnitario })),
      subtotal,
      descuento,
      total,
      metodo,
      metodoPagoNombre: metodo === "transferencia" ? "Transferencia / QR" : undefined,
      cuponCodigo: cupon?.codigo,
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1A1A1A]/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-[#F8F5F2] w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E0D5]">
          <div>
            <h2 className="font-serif text-2xl text-[#1A1A1A] flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#C9A96E]" /> Tu carrito
            </h2>
            {!vacio && (
              <p className="text-xs text-[#A0A0A0] mt-0.5 ml-[26px]">{cantidadTotal} producto{cantidadTotal === 1 ? "" : "s"}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Cerrar carrito" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#E5E0D5] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Items + footer, en un solo scroll — así el botón de pago nunca queda fuera de pantalla */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-6 py-5">
          {vacio ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#A0A0A0] gap-3 py-16">
              <ShoppingBag size={40} className="opacity-40" />
              <p className="text-sm">Tu carrito está vacío.</p>
              <button onClick={onClose} className="text-sm text-[#C9A96E] font-medium hover:underline mt-1">
                Ver colección
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.perfumeId}-${item.formato}`} className="flex gap-3 pb-4 border-b border-[#E5E0D5] last:border-0">
                  <img
                    src={resolverImagen(item.imagen)}
                    alt={item.nombre}
                    className="w-16 h-16 object-cover rounded-md bg-[#F5F5DC]/50 flex-shrink-0 mix-blend-multiply"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base text-[#1A1A1A] truncate">{item.nombre}</p>
                    <p className="text-xs text-[#A0A0A0] mb-2">{item.label} · {item.precioTexto} c/u</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 border border-[#E0E0E0] rounded-full px-1">
                        <button
                          onClick={() => setCantidad(item.perfumeId, item.formato, item.cantidad - 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#5A5A5A] hover:text-[#1A1A1A]"
                          aria-label="Restar"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-medium w-4 text-center">{item.cantidad}</span>
                        <button
                          onClick={() => setCantidad(item.perfumeId, item.formato, item.cantidad + 1)}
                          disabled={item.cantidad >= item.stockDisponible}
                          className="w-6 h-6 flex items-center justify-center text-[#5A5A5A] hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:text-[#5A5A5A]"
                          aria-label="Sumar"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-medium text-[#1A1A1A]">{formatearCOP(item.precioUnitario * item.cantidad)}</span>
                    </div>
                    {item.cantidad >= item.stockDisponible && (
                      <p className="text-[10px] text-[#B89250] mt-1">Última{item.stockDisponible === 1 ? "" : "s"} unidad{item.stockDisponible === 1 ? "" : "es"} disponible{item.stockDisponible === 1 ? "" : "s"}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.perfumeId, item.formato)}
                    aria-label="Quitar del carrito"
                    className="text-[#C9C4B8] hover:text-red-600 transition-colors self-start"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button onClick={clearCart} className="text-xs text-[#A0A0A0] hover:text-red-600 transition-colors underline">
                Vaciar carrito
              </button>
            </div>
          )}
          </div>

        {/* Footer: cupón + totales + checkout — pegajoso al fondo del scroll */}
        {!vacio && (
          <div className="sticky bottom-0 bg-[#F8F5F2] border-t border-[#E5E0D5] px-6 py-5 space-y-4">
            {/* Cupón */}
            {cupon ? (
              <div className="flex items-center justify-between bg-[#F0F7ED] border border-[#C9E4B8] rounded-md px-3 py-2">
                <span className="text-xs font-medium text-[#3A6B2A] flex items-center gap-1.5">
                  <Tag size={13} /> Cupón "{cupon.codigo}" aplicado
                </span>
                <button onClick={quitarCupon} className="text-xs text-[#5A5A5A] hover:text-red-600 underline">
                  Quitar
                </button>
              </div>
            ) : (
              <form onSubmit={handleAplicarCupon} className="flex gap-2">
                <input
                  type="text"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  placeholder="Código de cupón"
                  className="flex-1 px-3 py-2 border border-[#E0E0E0] rounded text-sm bg-white outline-none focus:border-[#C9A96E]"
                />
                <button
                  type="submit"
                  disabled={cuponCargando || !codigoInput.trim()}
                  className="px-4 py-2 bg-[#1A1A1A] text-white rounded text-sm font-medium disabled:opacity-40"
                >
                  {cuponCargando ? "..." : "Aplicar"}
                </button>
              </form>
            )}
            {cuponError && <p className="text-xs text-red-600 -mt-2">{cuponError}</p>}

            {/* Totales */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#5A5A5A]">
                <span>Subtotal</span>
                <span>{formatearCOP(subtotal)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-[#3A6B2A]">
                  <span>Descuento</span>
                  <span>-{formatearCOP(descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#1A1A1A] font-semibold text-base pt-1.5 border-t border-[#E5E0D5]">
                <span>Total</span>
                <span>{formatearCOP(total)}</span>
              </div>
            </div>

            {/* Método de pago */}
            {hayMetodosPago && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#EFEBE3] rounded-full">
                <button
                  type="button"
                  onClick={() => setMetodo("whatsapp")}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-colors ${
                    metodo === "whatsapp" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#5A5A5A]"
                  }`}
                >
                  <MessageCircle size={13} /> Coordinar por WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setMetodo("transferencia")}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-colors ${
                    metodo === "transferencia" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#5A5A5A]"
                  }`}
                >
                  <Landmark size={13} /> Transferencia / QR
                </button>
              </div>
            )}

            {hayMetodosPago && metodo === "transferencia" ? (
              <div className="space-y-4">
                {/* Paso 1: transferir */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B89250] mb-2">
                    Paso 1 · Transfiere {formatearCOP(total)} a una de estas cuentas
                  </p>
                  <div className="space-y-3">
                    {METODOS_PAGO.map((m) => (
                      <div key={m.id} className="border border-[#E5E0D5] rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-[#1A1A1A]">{m.nombre}</span>
                          {m.tipoCuenta && <span className="text-[10px] text-[#A0A0A0] uppercase tracking-wide">{m.tipoCuenta}</span>}
                        </div>
                        <p className="text-xs text-[#5A5A5A] mb-2">A nombre de {m.titular}</p>
                        <div className="flex items-center justify-between bg-[#F8F5F2] rounded px-3 py-2">
                          <span className="text-sm font-mono text-[#1A1A1A] tracking-wide">{m.numero}</span>
                          <button
                            type="button"
                            onClick={() => copiarNumero(m.id, m.numero)}
                            className="flex items-center gap-1 text-xs text-[#C9A96E] hover:text-[#1A1A1A] transition-colors flex-shrink-0"
                          >
                            {copiadoId === m.id ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                          </button>
                        </div>
                        {m.qrImagen && (
                          <a
                            href={resolverImagen(m.qrImagen)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-3 bg-white border border-[#E5E0D5] rounded-lg p-4 hover:border-[#C9A96E] transition-colors"
                          >
                            <img
                              src={resolverImagen(m.qrImagen)}
                              alt={`Código QR ${m.nombre}`}
                              className="w-full max-w-[220px] aspect-square object-contain mx-auto"
                            />
                            <p className="text-[11px] text-[#C9A96E] text-center mt-2 font-medium">Toca para ampliar y escanear</p>
                          </a>
                        )}
                        {m.nota && <p className="text-[10px] text-[#A0A0A0] mt-2">{m.nota}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paso 2: avisar con el comprobante — botón propio, pegado a la info de pago */}
                <div className="pt-1 border-t border-dashed border-[#E5E0D5]">
                  <div className="flex items-center justify-between mt-3 mb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B89250]">
                      Paso 2 · Envía tu comprobante
                    </p>
                    <span className="text-[10px] font-mono text-[#A0A0A0]">Ref. {referencia}</span>
                  </div>
                  <p className="text-xs text-[#5A5A5A] mb-3">
                    Ya que hayas transferido, toca el botón — se abre WhatsApp con tu pedido ya escrito (con esta referencia incluida), y ahí mismo adjuntas la foto o captura del comprobante para que {METODOS_PAGO[0]?.titular.split(" ")[0] || "nosotros"} confirme tu pago y el envío.
                  </p>
                  <button onClick={handleCheckout} className="w-full btn-gold py-4 rounded-sm font-medium tracking-wide text-sm flex items-center justify-center gap-2">
                    <MessageCircle size={16} /> Ya pagué, enviar comprobante
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button onClick={handleCheckout} className="w-full btn-gold py-4 rounded-sm font-medium tracking-wide text-sm flex items-center justify-center gap-2">
                  Finalizar pedido por WhatsApp
                </button>
                <p className="text-[10px] text-[#A0A0A0] text-center">
                  Te abrimos WhatsApp con tu pedido ya escrito — solo confirmas y coordinamos el pago y el envío.
                </p>
              </>
            )}

            {/* Confianza */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-[#8A8A8A] pt-1">
              <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-[#C9A96E]" /> 100% originales</span>
              <span className="flex items-center gap-1"><Truck size={12} className="text-[#C9A96E]" /> Envíos a toda Colombia</span>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
