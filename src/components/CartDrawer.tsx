import { useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, Tag, Copy, Check, ShieldCheck, Truck, MessageCircle, Landmark } from "lucide-react";
import { useCart, formatearCOP } from "../context/CartContext";
import { resolverImagen } from "../data/perfumes";
import { METODOS_PAGO } from "../data/pagos";

type MetodoCheckout = "whatsapp" | "transferencia";

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
  metodo: MetodoCheckout
): string {
  const lineas = items.map(
    (i) => `• ${i.nombre} (${i.label}) x${i.cantidad} — ${formatearCOP(i.precioUnitario * i.cantidad)}`
  );

  let mensaje = `Hola FRAGANTI 👋 quiero hacer este pedido:\n\n${lineas.join("\n")}\n\nSubtotal: ${formatearCOP(subtotal)}`;

  if (cuponCodigo && descuento > 0) {
    mensaje += `\nCupón ${cuponCodigo.toUpperCase()}: -${formatearCOP(descuento)}`;
  }

  mensaje += `\nTotal: ${formatearCOP(total)}\n\n`;
  mensaje += metodo === "transferencia"
    ? "Ya hice el pago por transferencia — les adjunto el comprobante en este chat. Quedo atento(a) para coordinar el envío. ¡Gracias!"
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
    const mensaje = construirMensajeWhatsApp(items, subtotal, cupon?.codigo, descuento, total, metodo);
    const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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

        {/* Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
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

        {/* Footer: cupón + totales + checkout */}
        {!vacio && (
          <div className="border-t border-[#E5E0D5] px-6 py-5 space-y-4">
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

            {hayMetodosPago && metodo === "transferencia" && (
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
                      <img
                        src={resolverImagen(m.qrImagen)}
                        alt={`Código QR ${m.nombre}`}
                        className="w-32 h-32 object-contain mt-3 mx-auto"
                      />
                    )}
                    {m.nota && <p className="text-[10px] text-[#A0A0A0] mt-2">{m.nota}</p>}
                  </div>
                ))}
                <p className="text-[10px] text-[#A0A0A0] text-center leading-relaxed">
                  Transfiere el total exacto ({formatearCOP(total)}) y guarda tu comprobante — lo vas a adjuntar en el siguiente paso por WhatsApp.
                </p>
              </div>
            )}

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

            {/* Confianza */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-[#8A8A8A]">
              <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-[#C9A96E]" /> 100% originales</span>
              <span className="flex items-center gap-1"><Truck size={12} className="text-[#C9A96E]" /> Envíos a toda Colombia</span>
            </div>

            <button onClick={handleCheckout} className="w-full btn-gold py-4 rounded-sm font-medium tracking-wide text-sm flex items-center justify-center gap-2">
              {metodo === "transferencia" ? "Ya pagué, enviar comprobante" : "Finalizar pedido por WhatsApp"}
            </button>
            <p className="text-[10px] text-[#A0A0A0] text-center">
              {metodo === "transferencia"
                ? "Te abrimos WhatsApp con tu pedido — adjunta ahí la foto de tu comprobante de pago."
                : "Te abrimos WhatsApp con tu pedido ya escrito — solo confirmas y coordinamos el pago y el envío."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
