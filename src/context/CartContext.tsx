import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { FORMATO_LABELS, type Perfume, type FormatoKey } from "../data/perfumes";
import { buscarCuponPorCodigo, calcularDescuento, type Cupon } from "../data/cupones";

export interface CartItem {
  perfumeId: number;
  formato: FormatoKey;
  nombre: string;
  imagen: string;
  precioTexto: string;
  precioUnitario: number; // en pesos, sin formato
  cantidad: number;
  stockDisponible: number;
}

interface CartContextValue {
  items: CartItem[];
  cantidadTotal: number;
  subtotal: number;
  cupon: Cupon | null;
  descuento: number;
  total: number;
  cuponError: string | null;
  cuponCargando: boolean;
  addToCart: (perfume: Perfume, formato: FormatoKey) => void;
  removeFromCart: (perfumeId: number, formato: FormatoKey) => void;
  setCantidad: (perfumeId: number, formato: FormatoKey, cantidad: number) => void;
  clearCart: () => void;
  aplicarCupon: (codigo: string) => Promise<void>;
  quitarCupon: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "fraganti_cart_v1";

/** Convierte "$195.000" → 195000. Robusto ante formatos con o sin "$"/puntos. */
export function parsePrecioCOP(texto: string): number {
  const soloDigitos = (texto || "").replace(/[^\d]/g, "");
  return soloDigitos ? parseInt(soloDigitos, 10) : 0;
}

export function formatearCOP(valor: number): string {
  return "$" + Math.round(valor).toLocaleString("es-CO");
}

function cargarCarritoGuardado(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => cargarCarritoGuardado());
  const [cupon, setCupon] = useState<Cupon | null>(null);
  const [cuponError, setCuponError] = useState<string | null>(null);
  const [cuponCargando, setCuponCargando] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Si el navegador bloquea localStorage (modo privado, etc.) el carrito
      // sigue funcionando en memoria durante la sesión, solo no persiste.
    }
  }, [items]);

  const addToCart = (perfume: Perfume, formato: FormatoKey) => {
    const info = perfume.formatos[formato];
    if (!info?.disponible || info.stock <= 0) return;

    setItems((prev) => {
      const existente = prev.find((i) => i.perfumeId === perfume.id && i.formato === formato);
      if (existente) {
        if (existente.cantidad >= info.stock) return prev; // no exceder el stock
        return prev.map((i) =>
          i.perfumeId === perfume.id && i.formato === formato ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      const nuevo: CartItem = {
        perfumeId: perfume.id,
        formato,
        nombre: perfume.name,
        imagen: perfume.image,
        precioTexto: info.precio,
        precioUnitario: parsePrecioCOP(info.precio),
        cantidad: 1,
        stockDisponible: info.stock,
      };
      return [...prev, nuevo];
    });
  };

  const removeFromCart = (perfumeId: number, formato: FormatoKey) => {
    setItems((prev) => prev.filter((i) => !(i.perfumeId === perfumeId && i.formato === formato)));
  };

  const setCantidad = (perfumeId: number, formato: FormatoKey, cantidad: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.perfumeId !== perfumeId || i.formato !== formato) return i;
          const limitada = Math.max(1, Math.min(cantidad, i.stockDisponible));
          return { ...i, cantidad: limitada };
        })
        .filter((i) => i.cantidad > 0)
    );
  };

  const clearCart = () => {
    setItems([]);
    setCupon(null);
    setCuponError(null);
  };

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0), [items]);
  const cantidadTotal = useMemo(() => items.reduce((sum, i) => sum + i.cantidad, 0), [items]);
  const descuento = useMemo(() => (cupon ? calcularDescuento(cupon, subtotal) : 0), [cupon, subtotal]);
  const total = Math.max(0, subtotal - descuento);

  const aplicarCupon = async (codigo: string) => {
    if (!codigo.trim()) return;
    setCuponCargando(true);
    setCuponError(null);
    try {
      const encontrado = await buscarCuponPorCodigo(codigo);
      if (!encontrado) {
        setCuponError("Ese cupón no existe.");
      } else if (!encontrado.activo) {
        setCuponError("Ese cupón ya no está activo.");
      } else {
        setCupon(encontrado);
      }
    } catch (e: any) {
      setCuponError(e.message || "No se pudo validar el cupón.");
    } finally {
      setCuponCargando(false);
    }
  };

  const quitarCupon = () => {
    setCupon(null);
    setCuponError(null);
  };

  return (
    <CartContext.Provider
      value={{
        items, cantidadTotal, subtotal, cupon, descuento, total, cuponError, cuponCargando,
        addToCart, removeFromCart, setCantidad, clearCart, aplicarCupon, quitarCupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}

export { FORMATO_LABELS };
