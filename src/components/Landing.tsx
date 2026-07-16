import React, { useState, useEffect, useRef } from "react";
import { 
  Menu, X, Search, ShoppingBag, ChevronRight, Phone, 
  MessageCircle, ArrowDown, MapPin, Clock, 
  Instagram, Check, Droplets, Star, SlidersHorizontal, Tag
} from "lucide-react";
import {
  loadPerfumes, FAMILIAS_CATALOGO, GENEROS_CATALOGO, CONCENTRACIONES_CATALOGO, QUIZ_QUESTIONS, calcularMatchDelQuiz,
  variantesOfrecidas, perfumeAgotado, primeraVarianteDisponible, resolverImagen,
  formatoEnOferta, perfumeEnOferta, porcentajeDescuento,
  type Perfume, type Variante, type Genero, type QuizOption,
} from "../data/perfumes";
import { useCart, parsePrecioCOP, formatearCOP } from "../context/CartContext";
import { loadResenas, resumenResenas, type Resena } from "../data/resenas";
import { CartDrawer } from "./CartDrawer";
import { QuickViewModal } from "./QuickViewModal";

/** Quita tildes y pasa a minúsculas, para que buscar "yara" encuentre "Yara" o "yará". */
function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Precio de referencia para ordenar por precio: el más bajo entre todas las variantes que el perfume ofrezca. */
function precioReferencia(p: Perfume): number {
  const variantes = variantesOfrecidas(p);
  if (variantes.length === 0) return Number.POSITIVE_INFINITY;
  const precios = variantes.map((v) => parsePrecioCOP(v.info.precio)).filter((n) => n > 0);
  return precios.length > 0 ? Math.min(...precios) : Number.POSITIVE_INFINITY;
}

type OrdenCatalogo = "relevancia" | "nombre-asc" | "nombre-desc" | "precio-asc" | "precio-desc";

const OPCIONES_ORDEN: { value: OrdenCatalogo; label: string }[] = [
  { value: "relevancia", label: "Más recientes" },
  { value: "nombre-asc", label: "Nombre: A-Z" },
  { value: "nombre-desc", label: "Nombre: Z-A" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
];

// ============================================================================
// DATOS DE CONTACTO — edita aquí si cambian tus redes o tu número.
// ============================================================================
const CONTACT = {
  whatsappNumber: "+573242695225",
  // Link con respuesta automática configurada en WhatsApp Business — se usa
  // en los botones principales de WhatsApp (mejor experiencia que un número plano).
  whatsappAutoReplyLink: "https://wa.me/message/7UXKMTVJUTO6N1",
  instagramUrl: "https://www.instagram.com/fraganti.co",
  tiktokUrl: "https://www.tiktok.com/@fraganti.co",
  storeAddress: "Cl. 11 # 14B-4, Barrio Pueblo Nuevo, Caucasia, Antioquia",
  // z=19 para acercar el mapa a nivel de calle/cuadra, mostrando solo Caucasia
  // (no municipios vecinos). La consulta usa el formato exacto de dirección
  // colombiana (sin "Barrio Pueblo Nuevo") porque así Google la geocodifica
  // directo al punto correcto en vez de dudar entre varios lugares.
  mapEmbedUrl: "https://www.google.com/maps?q=Cl.+11+%23+14B-4,+Caucasia,+Antioquia,+Colombia&z=19&output=embed",
  mapLinkUrl: "https://www.google.com/maps/search/?api=1&query=Cl.+11+%23+14B-4+Caucasia+Antioquia+Colombia",
};

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

// Intersection Observer Hook for fade-in animations
function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, ...options });

    observer.observe(target);
    return () => {
      observer.unobserve(target);
    };
  }, [options]);

  return [ref, isIntersecting] as const;
}

// FadeIn Wrapper Component
function FadeIn({ children, delay = 0, className = "", direction = "up" }: { children: React.ReactNode, delay?: number, className?: string, direction?: "up" | "left" | "right" | "none" }) {
  const [ref, isVisible] = useIntersectionObserver();
  
  let transformInit = "translate-y-10";
  if (direction === "left") transformInit = "translate-x-10";
  if (direction === "right") transformInit = "-translate-x-10";
  if (direction === "none") transformInit = "translate-x-0 translate-y-0";

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-y-0 translate-x-0" : `opacity-0 ${transformInit}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Tarjeta de producto individual — maneja su propia variante seleccionada
// (un tamaño de frasco completo, o un decant) y refleja el stock de cada una.
function ProductCard({
  product,
  delay,
  onQuickView,
  soloDecants,
  onInspiradoClick,
}: {
  product: Perfume;
  delay: number;
  onQuickView: () => void;
  /** Si está activo, esta tarjeta solo muestra y permite elegir decants — sin precios ni opción de frasco completo. */
  soloDecants: boolean;
  /** Se llama al hacer clic en "Inspirado en X" — filtra la colección por esa inspiración. */
  onInspiradoClick: (inspirado: string) => void;
}) {
  const todasVariantes = variantesOfrecidas(product);
  const variantesVisibles = soloDecants ? todasVariantes.filter((v) => v.esDecant) : todasVariantes;
  const agotado = perfumeAgotado(product);
  const enOferta = perfumeEnOferta(product);
  const { addToCart } = useCart();
  const [agregado, setAgregado] = useState(false);
  const [selected, setSelected] = useState<Variante | null>(
    () => variantesVisibles.find((v) => v.info.stock > 0) ?? variantesVisibles[0] ?? null
  );

  // Si cambia el modo "Solo Decants" (o el producto), y la variante elegida
  // ya no está entre las visibles, se reelige automáticamente una válida.
  useEffect(() => {
    setSelected((actual) => {
      if (actual && variantesVisibles.some((v) => v.id === actual.id)) return actual;
      return variantesVisibles.find((v) => v.info.stock > 0) ?? variantesVisibles[0] ?? null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloDecants, product.id]);

  const selectedInfo = selected?.info ?? null;
  const selectedSinStock = !selectedInfo || selectedInfo.stock <= 0;
  const selectedEnOferta = selectedInfo ? formatoEnOferta(selectedInfo) : false;
  const selectedDescuento = selectedInfo ? porcentajeDescuento(selectedInfo) : null;

  // Si el cliente elige un decant y hay foto de botella abierta cargada, se muestra esa foto.
  const mostrarAbierta = !!selected?.esDecant && !!product.imagenAbierta;
  const imagenActual = mostrarAbierta ? product.imagenAbierta! : product.image;

  const handleAgregar = () => {
    if (!selected || agotado || selectedSinStock) return;
    addToCart(product, selected);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  };

  return (
    <FadeIn delay={delay} direction="up">
      <div
        className={`product-card group bg-white rounded-lg p-6 flex flex-col h-full relative overflow-hidden ${
          agotado ? "grayscale opacity-70" : "cursor-pointer"
        }`}
      >
        {product.isNew && !agotado && (
          <span className="absolute top-6 left-6 z-10 bg-[#C9A96E] text-[#1A1A1A] text-[10px] font-bold px-3 py-1 tracking-widest rounded-sm">
            NUEVO
          </span>
        )}
        {!product.isNew && enOferta && !agotado && (
          <span className="absolute top-6 left-6 z-10 bg-red-600 text-white text-[10px] font-bold px-3 py-1 tracking-widest rounded-sm">
            OFERTA
          </span>
        )}
        {agotado && (
          <span className="absolute top-6 left-6 z-10 bg-[#5A5A5A] text-white text-[10px] font-bold px-3 py-1 tracking-widest rounded-sm">
            AGOTADO
          </span>
        )}

        <div className="product-image-container relative h-72 mb-8 bg-[#F5F5DC]/30 rounded-md overflow-hidden flex items-center justify-center">
          <img
            src={resolverImagen(imagenActual)}
            alt={product.name}
            loading={delay < 450 ? "eager" : "lazy"}
            decoding="async"
            className="w-full h-full object-cover mix-blend-multiply transition-opacity duration-300"
          />

          {/* Quick add overlay on hover */}
          <div className="absolute inset-0 bg-[#1A1A1A]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <button
              onClick={onQuickView}
              className="bg-[#F8F5F2] text-[#1A1A1A] px-6 py-3 rounded-sm font-medium text-sm tracking-wide hover:bg-[#C9A96E] hover:text-white transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300"
            >
              VISTA RÁPIDA
            </button>
          </div>
        </div>

        <div className="flex flex-col flex-grow text-center">
          <span className="text-[#C9A96E] text-xs font-semibold tracking-widest uppercase mb-2">
            {product.family}{product.concentracion ? ` · ${product.concentracion}` : ""}
          </span>
          <h3 className="font-serif text-2xl text-[#1A1A1A] mb-1">{product.name}</h3>
          {product.inspiradoEn && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onInspiradoClick(product.inspiradoEn!); }}
              className="text-[#A0A0A0] text-xs italic font-serif mb-1 hover:text-[#C9A96E] transition-colors underline decoration-dotted underline-offset-2"
            >
              Inspirado en {product.inspiradoEn}
            </button>
          )}
          <p className="text-[#5A5A5A] text-sm italic mb-4 flex-grow font-serif">{product.notasCorta}</p>

          {/* Selector de variante: solo se muestran las que el negocio ofrece (y, en modo Solo Decants, solo decants) */}
          {variantesVisibles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {variantesVisibles.map((variante) => {
                const sinStock = variante.info.stock <= 0;
                const isSelected = selected?.id === variante.id;
                return (
                  <button
                    key={variante.id}
                    type="button"
                    disabled={sinStock}
                    onClick={() => setSelected(variante)}
                    className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs border transition-all ${
                      sinStock
                        ? "border-[#E0E0E0] text-[#B0B0B0] bg-[#F5F5F5] cursor-not-allowed line-through"
                        : isSelected
                        ? "bg-[#1A1A1A] text-[#F8F5F2] border-[#1A1A1A]"
                        : "border-[#d1cec7] text-[#5A5A5A] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                    }`}
                  >
                    {variante.label}{sinStock ? " · Agotado" : ""}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mb-6 flex items-center justify-center gap-2 flex-wrap">
            {!agotado && selectedInfo && !selectedSinStock ? (
              <>
                {selectedEnOferta && (
                  <span className="text-[#A0A0A0] text-sm line-through">{selectedInfo.precioAntes}</span>
                )}
                <span className={`font-medium tracking-wide ${selectedEnOferta ? "text-red-600" : "text-[#1A1A1A]"}`}>
                  {selectedInfo.precio}
                </span>
                {selectedEnOferta && selectedDescuento !== null && (
                  <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
                    -{selectedDescuento}%
                  </span>
                )}
              </>
            ) : (
              <span className="text-[#1A1A1A] font-medium tracking-wide">Agotado</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAgregar}
            disabled={agotado || selectedSinStock}
            className={`w-full py-3 rounded-sm text-sm tracking-widest font-medium transition-colors ${
              agotado || selectedSinStock
                ? "border border-[#E0E0E0] text-[#B0B0B0] cursor-not-allowed"
                : agregado
                ? "bg-[#1A1A1A] text-[#F8F5F2]"
                : "btn-outline group-hover:bg-[#1A1A1A] group-hover:text-[#F8F5F2]"
            }`}
          >
            {agotado || selectedSinStock ? "AGOTADO" : agregado ? "✓ AGREGADO" : "AGREGAR AL CARRITO"}
          </button>
        </div>
      </div>
    </FadeIn>
  );
}

export function Landing() {
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Búsqueda, orden y filtros de la colección
  const [searchTerm, setSearchTerm] = useState("");
  const [orden, setOrden] = useState<OrdenCatalogo>("relevancia");
  const [filtroFamilias, setFiltroFamilias] = useState<string[]>([]);
  const [filtroGeneros, setFiltroGeneros] = useState<Genero[]>([]);
  const [filtroConcentraciones, setFiltroConcentraciones] = useState<string[]>([]);
  const [filtroAromas, setFiltroAromas] = useState<string[]>([]);
  const [filtroInspirados, setFiltroInspirados] = useState<string[]>([]);
  const [soloDecants, setSoloDecants] = useState(false);
  const [soloOfertas, setSoloOfertas] = useState(false);
  const [panelFiltrosAbierto, setPanelFiltrosAbierto] = useState(false);
  // De entrada solo se muestra una parte del catálogo (más rápido de cargar);
  // "Ver todo el catálogo" revela el resto sin necesidad de filtrar o buscar.
  const [mostrarTodoElCatalogo, setMostrarTodoElCatalogo] = useState(false);
  const LIMITE_CATALOGO_INICIAL = 9;
  
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizOption[]>([]);
  const [quizAnimating, setQuizAnimating] = useState(false);

  const [quickViewId, setQuickViewId] = useState<number | null>(null);
  const [PRODUCTS, setPRODUCTS] = useState<Perfume[]>([]);
  const quickViewProduct = PRODUCTS.find(p => p.id === quickViewId) ?? null;
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cantidadTotal } = useCart();
  const [RESENAS, setRESENAS] = useState<Resena[]>([]);

  useEffect(() => {
    loadPerfumes()
      .then(setPRODUCTS)
      .catch((err) => console.error("Error cargando el catálogo:", err));
    loadResenas()
      .then(setRESENAS)
      .catch((err) => console.error("Error cargando reseñas:", err));
  }, []);

  useEffect(() => {
    // Simulate loading screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleQuizAnswer = (option: QuizOption) => {
    if (quizAnimating) return;
    setQuizAnimating(true);
    setTimeout(() => {
      setQuizAnswers([...quizAnswers, option]);
      setQuizStep(prev => prev + 1);
      setQuizAnimating(false);
    }, 400);
  };

  const resetQuiz = () => {
    setQuizAnimating(true);
    setTimeout(() => {
      setQuizStep(0);
      setQuizAnswers([]);
      setQuizAnimating(false);
    }, 400);
  };

  // Todos los aromas/notas distintos que existen en el catálogo actual,
  // para armar el filtro de "Aroma" dinámicamente (no hay que mantenerlo a mano).
  // Orden aleatorio del catálogo — se calcula una sola vez por carga de página (no se re-mezcla
  // en cada clic de filtro), para que la colección se sienta distinta cada visita sin "saltar"
  // mientras el cliente está filtrando o buscando.
  const ordenAleatorioIndex = React.useMemo(() => {
    const ids = PRODUCTS.map((p) => p.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const mapa = new Map<number, number>();
    ids.forEach((id, idx) => mapa.set(id, idx));
    return mapa;
  }, [PRODUCTS]);

  const todosLosAromas = React.useMemo(() => {
    const set = new Set<string>();
    PRODUCTS.forEach((p) => {
      [...p.notas.salida, ...p.notas.corazon, ...p.notas.fondo].forEach((n) => set.add(n));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [PRODUCTS]);

  // Todos los "inspirado en" distintos que existen en el catálogo actual (sin vacíos), para el filtro.
  const todosLosInspirados = React.useMemo(() => {
    const set = new Set<string>();
    PRODUCTS.forEach((p) => { if (p.inspiradoEn?.trim()) set.add(p.inspiradoEn.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [PRODUCTS]);

  const toggleEnLista = <T,>(lista: T[], valor: T): T[] =>
    lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

  const hayFiltrosActivos = filtroFamilias.length > 0 || filtroGeneros.length > 0 || filtroConcentraciones.length > 0 || filtroAromas.length > 0 || filtroInspirados.length > 0 || soloDecants || soloOfertas || searchTerm.trim() !== "";

  // Resumen de todos los filtros activos, como etiquetas individuales que se pueden quitar una por una.
  const chipsActivos = React.useMemo(() => {
    const chips: { key: string; label: string; onQuitar: () => void }[] = [];
    if (searchTerm.trim()) chips.push({ key: "buscar", label: `"${searchTerm.trim()}"`, onQuitar: () => setSearchTerm("") });
    filtroFamilias.forEach((f) => chips.push({ key: `familia-${f}`, label: f, onQuitar: () => setFiltroFamilias((prev) => prev.filter((x) => x !== f)) }));
    filtroGeneros.forEach((g) => chips.push({ key: `genero-${g}`, label: g, onQuitar: () => setFiltroGeneros((prev) => prev.filter((x) => x !== g)) }));
    filtroConcentraciones.forEach((c) => chips.push({ key: `concentracion-${c}`, label: c, onQuitar: () => setFiltroConcentraciones((prev) => prev.filter((x) => x !== c)) }));
    filtroAromas.forEach((a) => chips.push({ key: `aroma-${a}`, label: a, onQuitar: () => setFiltroAromas((prev) => prev.filter((x) => x !== a)) }));
    filtroInspirados.forEach((i) => chips.push({ key: `inspirado-${i}`, label: `Inspirado en ${i}`, onQuitar: () => setFiltroInspirados((prev) => prev.filter((x) => x !== i)) }));
    if (soloDecants) chips.push({ key: "decants", label: "Solo Decants", onQuitar: () => setSoloDecants(false) });
    if (soloOfertas) chips.push({ key: "ofertas", label: "En Oferta", onQuitar: () => setSoloOfertas(false) });
    return chips;
  }, [searchTerm, filtroFamilias, filtroGeneros, filtroConcentraciones, filtroAromas, filtroInspirados, soloDecants, soloOfertas]);

  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltroFamilias([]);
    setFiltroGeneros([]);
    setFiltroConcentraciones([]);
    setFiltroAromas([]);
    setFiltroInspirados([]);
    setSoloDecants(false);
    setSoloOfertas(false);
    setOrden("relevancia");
  };

  const filteredProducts = React.useMemo(() => {
    let lista = PRODUCTS;

    if (searchTerm.trim()) {
      const termino = normalizarTexto(searchTerm.trim());
      lista = lista.filter((p) =>
        normalizarTexto(p.name).includes(termino) || normalizarTexto(p.inspiradoEn || "").includes(termino)
      );
    }

    // Cada filtro es una INTERSECCIÓN: si marcas varios valores en un mismo grupo,
    // el perfume tiene que cumplirlos TODOS (no basta con cumplir uno solo). Esto
    // hace que los filtros siempre reduzcan la búsqueda en vez de ampliarla — por
    // ejemplo, en Notas, marcar "Vainilla" y "Bergamota" solo muestra perfumes que
    // tengan ambas notas, no perfumes que tengan cualquiera de las dos.
    if (filtroFamilias.length > 0) {
      lista = lista.filter((p) => filtroFamilias.every((f) => f === p.family));
    }

    if (filtroGeneros.length > 0) {
      lista = lista.filter((p) => filtroGeneros.every((g) => g === p.genero));
    }

    if (filtroConcentraciones.length > 0) {
      lista = lista.filter((p) => filtroConcentraciones.every((c) => c === p.concentracion));
    }

    if (filtroAromas.length > 0) {
      lista = lista.filter((p) => {
        const notasPerfume = [...p.notas.salida, ...p.notas.corazon, ...p.notas.fondo];
        return filtroAromas.every((aroma) => notasPerfume.includes(aroma));
      });
    }

    if (filtroInspirados.length > 0) {
      lista = lista.filter((p) => filtroInspirados.every((i) => i === (p.inspiradoEn || "").trim()));
    }

    if (soloDecants) {
      lista = lista.filter((p) => p.formatos.decant5.disponible || p.formatos.decant10.disponible);
    }

    if (soloOfertas) {
      lista = lista.filter((p) => perfumeEnOferta(p));
    }

    const ordenada = [...lista];
    switch (orden) {
      case "nombre-asc":
        ordenada.sort((a, b) => a.name.localeCompare(b.name, "es"));
        break;
      case "nombre-desc":
        ordenada.sort((a, b) => b.name.localeCompare(a.name, "es"));
        break;
      case "precio-asc":
        ordenada.sort((a, b) => precioReferencia(a) - precioReferencia(b));
        break;
      case "precio-desc":
        ordenada.sort((a, b) => {
          const pa = precioReferencia(a);
          const pb = precioReferencia(b);
          // Los que no tienen precio (agotados/sin formato) siempre quedan al final,
          // sin importar la dirección del orden.
          if (pa === Number.POSITIVE_INFINITY) return 1;
          if (pb === Number.POSITIVE_INFINITY) return -1;
          return pb - pa;
        });
        break;
      default:
        // "relevancia" = orden aleatorio, estable mientras no se recargue el catálogo
        ordenada.sort((a, b) => (ordenAleatorioIndex.get(a.id) ?? 0) - (ordenAleatorioIndex.get(b.id) ?? 0));
        break;
    }

    // Sin importar el orden elegido: los agotados nunca se muestran de primeros.
    // A medida que un perfume se agota, va bajando solo hasta el final de la lista.
    ordenada.sort((a, b) => (perfumeAgotado(a) ? 1 : 0) - (perfumeAgotado(b) ? 1 : 0));

    return ordenada;
  }, [PRODUCTS, searchTerm, filtroFamilias, filtroGeneros, filtroConcentraciones, filtroAromas, filtroInspirados, soloDecants, soloOfertas, orden, ordenAleatorioIndex]);

  // De entrada solo se muestra un adelanto del catálogo (más liviano de cargar).
  // Apenas hay una búsqueda o un filtro activo, o el cliente pide ver todo, se muestran todos los resultados.
  const productosAMostrar = React.useMemo(() => {
    if (mostrarTodoElCatalogo || hayFiltrosActivos) return filteredProducts;
    return filteredProducts.slice(0, LIMITE_CATALOGO_INICIAL);
  }, [filteredProducts, mostrarTodoElCatalogo, hayFiltrosActivos]);

  // Perfumes que sí se venden en decant (5ml o 10ml) — para la sección de Decants.
  const productosConDecants = React.useMemo(
    () => PRODUCTS.filter((p) => p.formatos.decant5.disponible || p.formatos.decant10.disponible),
    [PRODUCTS]
  );

  const precioDecantMinimo = React.useMemo(() => {
    let minimo = Number.POSITIVE_INFINITY;
    productosConDecants.forEach((p) => {
      (["decant5", "decant10"] as const).forEach((key) => {
        const f = p.formatos[key];
        if (f.disponible) {
          const precio = parsePrecioCOP(f.precio);
          if (precio > 0 && precio < minimo) minimo = precio;
        }
      });
    });
    return minimo === Number.POSITIVE_INFINITY ? null : minimo;
  }, [productosConDecants]);

  // Al hacer clic en la lupa del encabezado: baja hasta el buscador de la colección y lo enfoca.
  const irABuscar = () => {
    document.getElementById("coleccion")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => searchInputRef.current?.focus(), 450);
  };

  const irADecants = () => {
    limpiarFiltros();
    setSoloDecants(true);
    setTimeout(() => {
      document.getElementById("coleccion")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // Al hacer clic en "Inspirado en X" (tarjeta o vista rápida), filtra la colección por esa inspiración.
  const filtrarPorInspirado = (inspirado: string) => {
    limpiarFiltros();
    setFiltroInspirados([inspirado]);
    setQuickViewId(null);
    setTimeout(() => {
      document.getElementById("coleccion")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // Perfume real del catálogo que mejor encaja con las respuestas del test.
  const quizMatch = React.useMemo(() => {
    if (quizAnswers.length < QUIZ_QUESTIONS.length) return null;
    return calcularMatchDelQuiz(quizAnswers, PRODUCTS);
  }, [quizAnswers, PRODUCTS]);

  const resumenGoogle = React.useMemo(() => resumenResenas(RESENAS), [RESENAS]);

  return (
    <div className="min-h-screen bg-[#F8F5F2] text-[#1A1A1A] font-poppins selection:bg-[#C9A96E] selection:text-white">
      <style dangerouslySetInnerHTML={{__html: `
        /* Las fuentes (Cormorant Garamond / Poppins) se cargan como <link> no-bloqueante en index.html */
        
        .font-serif {
          font-family: 'Cormorant Garamond', serif;
        }
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
        
        @keyframes mist-fade {
          0% { opacity: 0; filter: blur(10px); transform: translateY(20px) scale(0.95); }
          50% { opacity: 1; filter: blur(0px); transform: translateY(0) scale(1.05); }
          100% { opacity: 0; filter: blur(10px); transform: translateY(-20px) scale(1); }
        }
        
        @keyframes logo-reveal {
          0% { opacity: 0; letter-spacing: 0.5em; filter: blur(10px); }
          100% { opacity: 1; letter-spacing: 0.2em; filter: blur(0); }
        }
        
        @keyframes fade-out {
          0% { opacity: 1; visibility: visible; }
          100% { opacity: 0; visibility: hidden; }
        }

        @keyframes map-ring-pulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .map-ring {
          animation: map-ring-pulse 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
        }
        .map-ring-delay {
          animation-delay: 1.1s;
        }
        
        .loader-container {
          animation: fade-out 0.8s ease-in-out 1.5s forwards;
        }
        .loader-logo {
          animation: logo-reveal 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .loader-mist {
          animation: mist-fade 2s ease-in-out infinite;
        }

        .gold-gradient {
          background: linear-gradient(135deg, #C9A96E 0%, #E6C998 50%, #B89250 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .btn-gold {
          background: linear-gradient(135deg, #D4AF37 0%, #C9A96E 100%);
          color: #1A1A1A;
          transition: all 0.3s ease;
        }
        .btn-gold:hover {
          background: linear-gradient(135deg, #E6C998 0%, #D4AF37 100%);
          box-shadow: 0 10px 25px -5px rgba(201, 169, 110, 0.4);
          transform: translateY(-2px);
        }

        .btn-outline {
          border: 1px solid #1A1A1A;
          color: #1A1A1A;
          transition: all 0.3s ease;
        }
        .btn-outline:hover {
          background: #1A1A1A;
          color: #F8F5F2;
        }

        .btn-outline-cream {
          border: 1px solid #F8F5F2;
          color: #F8F5F2;
          transition: all 0.3s ease;
        }
        .btn-outline-cream:hover {
          background: #F8F5F2;
          color: #1A1A1A;
        }

        .product-card {
          transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .product-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);
        }
        .product-image-container img {
          transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .product-card:hover .product-image-container img {
          transform: scale(1.08);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #C9A96E;
          border-radius: 10px;
        }
      `}} />

      {/* LOADING SCREEN */}
      {isLoading && (
        <div className="loader-container fixed inset-0 z-[100] bg-[#121212] flex items-center justify-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 flex items-center justify-center">
             <div className="w-[300px] h-[300px] bg-[#C9A96E] rounded-full blur-[100px] loader-mist"></div>
          </div>
          <div className="loader-logo z-10 relative flex flex-col items-center gap-5">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-[#C9A96E]/50 flex items-center justify-center bg-[#F8F5F2]/[0.03]">
              <img
                src="/images/logo-fraganti.png"
                alt="FRAGANTI"
                className="w-10 h-10 md:w-12 md:h-12 object-contain"
              />
            </div>
            <h1 className="font-serif text-4xl md:text-6xl text-[#F8F5F2] tracking-[0.2em] font-light">
              FRAGANTI
            </h1>
          </div>
        </div>
      )}

      {/* NAVIGATION */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? "bg-[#1A1A1A]/95 backdrop-blur-md py-4 shadow-lg" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center">
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-[#F8F5F2]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <a href="#" className={`flex items-center gap-2 md:gap-3 font-serif text-xl md:text-3xl font-medium tracking-[0.1em] md:tracking-[0.15em] transition-colors duration-300 ${isScrolled ? "text-[#C9A96E]" : "text-[#C9A96E] md:text-[#F8F5F2]"}`}>
            <img
              src="/images/logo-fraganti.png"
              alt="FRAGANTI"
              className="h-7 md:h-10 w-auto object-contain"
            />
            FRAGANTI
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#coleccion" className={`text-sm tracking-widest hover:text-[#C9A96E] transition-colors ${isScrolled ? "text-[#F8F5F2]" : "text-[#F8F5F2]"}`}>COLECCIÓN</a>
            <a href="#decants" className={`text-sm tracking-widest hover:text-[#C9A96E] transition-colors ${isScrolled ? "text-[#F8F5F2]" : "text-[#F8F5F2]"}`}>DECANTS</a>
            <a href="#test" className={`text-sm tracking-widest hover:text-[#C9A96E] transition-colors ${isScrolled ? "text-[#F8F5F2]" : "text-[#F8F5F2]"}`}>TEST OLFATIVO</a>
            <a href="#contacto" className={`text-sm tracking-widest hover:text-[#C9A96E] transition-colors ${isScrolled ? "text-[#F8F5F2]" : "text-[#F8F5F2]"}`}>CONTACTO</a>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-2.5 md:space-x-4">
            {/* Redes — junto al buscador en todas las pantallas, incluido el celular */}
            <div className="flex items-center space-x-2.5 md:space-x-3 pr-2.5 md:pr-3 mr-0.5 md:mr-1 border-r border-current/20">
              <a
                href={CONTACT.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de FRAGANTI"
                className={`hover:text-[#C9A96E] transition-colors ${isScrolled ? "text-[#F8F5F2]" : "text-[#F8F5F2]"}`}
              >
                <Instagram size={16} />
              </a>
              <a
                href={CONTACT.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok de FRAGANTI"
                className={`hover:text-[#C9A96E] transition-colors ${isScrolled ? "text-[#F8F5F2]" : "text-[#F8F5F2]"}`}
              >
                <TikTokIcon size={15} />
              </a>
            </div>
            <button
              onClick={irABuscar}
              aria-label="Buscar en la colección"
              className={`hover:text-[#C9A96E] transition-colors ${isScrolled ? "text-[#F8F5F2]" : "text-[#F8F5F2]"}`}
            >
              <Search size={19} />
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Ver carrito"
              className={`hover:text-[#C9A96E] transition-colors relative ${isScrolled ? "text-[#F8F5F2]" : "text-[#F8F5F2]"}`}
            >
              <ShoppingBag size={19} />
              {cantidadTotal > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#C9A96E] text-[#1A1A1A] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cantidadTotal}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden absolute top-full left-0 w-full bg-[#1A1A1A] border-t border-[#333] transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? "max-h-[400px]" : "max-h-0 border-transparent"}`}>
          <div className="flex flex-col p-6 space-y-4">
            <a href="#coleccion" onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5F2] text-lg font-serif tracking-wide border-b border-[#333] pb-2">Colección</a>
            <a href="#decants" onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5F2] text-lg font-serif tracking-wide border-b border-[#333] pb-2">Decants</a>
            <a href="#test" onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5F2] text-lg font-serif tracking-wide border-b border-[#333] pb-2">Test Olfativo</a>
            <a href="#contacto" onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5F2] text-lg font-serif tracking-wide pb-2">Contacto</a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0">
          <img 
            src="/images/fraganti-hero.jpg" 
            alt="Luxury perfume macro" 
            className="w-full h-full object-cover object-center scale-105"
            style={{ transform: "scale(1.05)", filter: "brightness(0.8)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/70 via-[#1a1a1a]/50 to-[#1a1a1a]/90"></div>
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
          {/* Transición suave hacia el tono hueso de la siguiente sección, en vez de un corte duro */}
          <div className="absolute bottom-0 inset-x-0 h-28 md:h-40 bg-gradient-to-b from-transparent to-[#F8F5F2]/70"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto mt-20">
          <FadeIn delay={300} className="mb-6">
            <span className="inline-block py-1.5 px-4 border border-[#C9A96E]/50 rounded-full text-xs md:text-sm tracking-widest text-[#F8F5F2] bg-[#1A1A1A]/30 backdrop-blur-sm">
              <span className="text-[#C9A96E]">✦</span> 100% ORIGINALES • ENVÍOS A TODO COLOMBIA
            </span>
          </FadeIn>
          
          <FadeIn delay={500}>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-[#F8F5F2] font-light leading-tight mb-2 drop-shadow-lg">
              Descubre tu <i className="font-serif italic text-[#F8F5F2]">esencia.</i>
            </h1>
          </FadeIn>
          
          <FadeIn delay={700}>
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl gold-gradient font-medium mb-8 drop-shadow-md">
              Vive el lujo.
            </h2>
          </FadeIn>
          
          <FadeIn delay={900}>
            <p className="text-[#F8F5F2]/80 text-lg md:text-xl font-light mb-12 max-w-2xl mx-auto">
              Perfumes originales que cuentan tu historia. De los exóticos aromas árabes a la precisión de las casas de diseño.
            </p>
          </FadeIn>
          
          <FadeIn delay={1100} className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <a href="#coleccion" className="btn-gold px-8 py-4 rounded-sm font-medium tracking-wide w-full sm:w-auto text-sm flex items-center justify-center gap-2">
              EXPLORAR LA COLECCIÓN <ChevronRight size={16} />
            </a>
            <a href="#test" className="btn-outline-cream px-8 py-4 rounded-sm font-medium tracking-wide w-full sm:w-auto text-sm backdrop-blur-sm">
              ENCUENTRA TU AROMA
            </a>
          </FadeIn>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce z-10 text-[#F8F5F2]/50">
          <ArrowDown size={24} strokeWidth={1} />
        </div>
      </section>

      {/* COLECCIÓN DE PERFUMES */}
      <section id="coleccion" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto bg-[#F8F5F2]">
        <FadeIn>
          <div className="flex flex-col items-center mb-12">
            <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-4 text-center">Nuestra Colección</h2>
            <div className="h-[1px] w-24 bg-[#C9A96E] mb-10"></div>

            {/* Búsqueda + Orden */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl mb-5">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o por a qué está inspirado..."
                  className="w-full pl-11 pr-4 py-3 rounded-full border border-[#d1cec7] bg-white text-sm outline-none focus:border-[#C9A96E] transition-colors"
                />
              </div>
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value as OrdenCatalogo)}
                className="px-4 py-3 rounded-full border border-[#d1cec7] bg-white text-sm outline-none focus:border-[#C9A96E] cursor-pointer"
                aria-label="Ordenar por"
              >
                {OPCIONES_ORDEN.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>

            {/* Resumen de filtros activos — se ve de un vistazo qué está aplicado y se puede quitar uno por uno */}
            {chipsActivos.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-2xl mb-6">
                {chipsActivos.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={chip.onQuitar}
                    className="flex items-center gap-1.5 bg-[#1A1A1A] text-[#F8F5F2] text-xs font-medium pl-3 pr-2 py-1.5 rounded-full hover:bg-[#333] transition-colors"
                  >
                    {chip.label}
                    <X size={12} className="text-[#C9A96E]" />
                  </button>
                ))}
                <button
                  onClick={limpiarFiltros}
                  className="text-xs text-[#A0A0A0] underline hover:text-red-600 transition-colors ml-1"
                >
                  Limpiar todo
                </button>
              </div>
            )}

            {/* Un solo botón de entrada a todos los filtros — familia, género, presentación y notas */}
            <button
              onClick={() => setPanelFiltrosAbierto((v) => !v)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm border transition-all duration-300 ${
                panelFiltrosAbierto || filtroFamilias.length > 0 || filtroGeneros.length > 0 || filtroConcentraciones.length > 0 || filtroAromas.length > 0 || filtroInspirados.length > 0 || soloDecants || soloOfertas
                ? "bg-[#C9A96E] text-[#1A1A1A] border-[#C9A96E]"
                : "bg-transparent text-[#5A5A5A] border-[#d1cec7] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
              }`}
            >
              <SlidersHorizontal size={14} />
              Filtros
              {(filtroFamilias.length + filtroGeneros.length + filtroConcentraciones.length + filtroAromas.length + filtroInspirados.length + Number(soloDecants) + Number(soloOfertas)) > 0 &&
                ` (${filtroFamilias.length + filtroGeneros.length + filtroConcentraciones.length + filtroAromas.length + filtroInspirados.length + Number(soloDecants) + Number(soloOfertas)})`}
              <ChevronRight size={14} className={`transition-transform duration-300 ${panelFiltrosAbierto ? "rotate-90" : ""}`} />
            </button>

            {/* Panel de filtros: familia, género, presentación y notas — agrupados y rotulados, no palabras sueltas */}
            {panelFiltrosAbierto && (
              <div className="w-full max-w-3xl bg-white border border-[#E5E0D5] rounded-xl p-6 md:p-8 mt-4 text-left">
                <p className="text-[11px] text-[#A0A0A0] mb-5 -mt-1">
                  Los filtros se combinan entre sí: mientras más marques, más se reduce la búsqueda.
                </p>
                <div className="mb-6">
                  <span className="block text-xs font-semibold uppercase tracking-widest text-[#B89250] mb-2.5">Familia olfativa</span>
                  <div className="flex flex-wrap gap-2">
                    {FAMILIAS_CATALOGO.map((familia) => (
                      <button
                        key={familia}
                        onClick={() => setFiltroFamilias((prev) => toggleEnLista(prev, familia))}
                        className={`px-4 py-1.5 rounded-full text-xs border transition-colors ${
                          filtroFamilias.includes(familia)
                          ? "bg-[#1A1A1A] text-[#F8F5F2] border-[#1A1A1A]"
                          : "border-[#d1cec7] text-[#5A5A5A] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                        }`}
                      >
                        {familia}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-[#F0EEE9] mb-6"></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-widest text-[#B89250] mb-2.5">Género</span>
                    <div className="flex flex-wrap gap-2">
                      {GENEROS_CATALOGO.map((genero) => (
                        <button
                          key={genero}
                          onClick={() => setFiltroGeneros((prev) => toggleEnLista(prev, genero))}
                          className={`px-4 py-1.5 rounded-full text-xs border transition-colors ${
                            filtroGeneros.includes(genero)
                            ? "bg-[#1A1A1A] text-[#F8F5F2] border-[#1A1A1A]"
                            : "border-[#d1cec7] text-[#5A5A5A] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                          }`}
                        >
                          {genero}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-widest text-[#B89250] mb-2.5">Concentración</span>
                    <div className="flex flex-wrap gap-2">
                      {CONCENTRACIONES_CATALOGO.map((c) => (
                        <button
                          key={c}
                          onClick={() => setFiltroConcentraciones((prev) => toggleEnLista(prev, c))}
                          className={`px-4 py-1.5 rounded-full text-xs border transition-colors ${
                            filtroConcentraciones.includes(c)
                            ? "bg-[#1A1A1A] text-[#F8F5F2] border-[#1A1A1A]"
                            : "border-[#d1cec7] text-[#5A5A5A] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-widest text-[#B89250] mb-2.5">Presentación</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSoloDecants((v) => !v)}
                        className={`px-4 py-1.5 rounded-full text-xs border transition-colors flex items-center gap-1.5 ${
                          soloDecants
                          ? "bg-[#1A1A1A] text-[#F8F5F2] border-[#1A1A1A]"
                          : "border-[#d1cec7] text-[#5A5A5A] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                        }`}
                      >
                        <Droplets size={12} /> Solo Decants
                      </button>
                      <button
                        onClick={() => setSoloOfertas((v) => !v)}
                        className={`px-4 py-1.5 rounded-full text-xs border transition-colors flex items-center gap-1.5 ${
                          soloOfertas
                          ? "bg-red-600 text-white border-red-600"
                          : "border-[#d1cec7] text-[#5A5A5A] hover:border-red-600 hover:text-red-600"
                        }`}
                      >
                        <Tag size={12} /> En Oferta
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-[#F0EEE9] mb-6"></div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-widest text-[#B89250] mb-2.5">Notas y aromas</span>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {todosLosAromas.map((aroma) => (
                      <button
                        key={aroma}
                        onClick={() => setFiltroAromas((prev) => toggleEnLista(prev, aroma))}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                          filtroAromas.includes(aroma)
                          ? "bg-[#1A1A1A] text-[#F8F5F2] border-[#1A1A1A]"
                          : "border-[#d1cec7] text-[#5A5A5A] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                        }`}
                      >
                        {aroma}
                      </button>
                    ))}
                  </div>
                </div>

                {todosLosInspirados.length > 0 && (
                  <>
                    <div className="h-px bg-[#F0EEE9] my-6"></div>
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-widest text-[#B89250] mb-2.5">Inspirado en</span>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                        {todosLosInspirados.map((insp) => (
                          <button
                            key={insp}
                            onClick={() => setFiltroInspirados((prev) => toggleEnLista(prev, insp))}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                              filtroInspirados.includes(insp)
                              ? "bg-[#1A1A1A] text-[#F8F5F2] border-[#1A1A1A]"
                              : "border-[#d1cec7] text-[#5A5A5A] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                            }`}
                          >
                            {insp}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {hayFiltrosActivos && (
                  <div className="mt-6 pt-5 border-t border-[#F0EEE9] flex items-center justify-between flex-wrap gap-3">
                    <span className="text-xs text-[#A0A0A0]">{filteredProducts.length} resultado{filteredProducts.length === 1 ? "" : "s"}</span>
                    <button onClick={limpiarFiltros} className="text-sm text-[#C9A96E] underline hover:text-[#1A1A1A] transition-colors">
                      Limpiar todos los filtros
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {productosAMostrar.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              delay={index * 150}
              onQuickView={() => setQuickViewId(product.id)}
              soloDecants={soloDecants}
              onInspiradoClick={filtrarPorInspirado}
            />
          ))}
        </div>

        {!hayFiltrosActivos && !mostrarTodoElCatalogo && filteredProducts.length > LIMITE_CATALOGO_INICIAL && (
          <div className="text-center mt-14">
            <button
              onClick={() => setMostrarTodoElCatalogo(true)}
              className="border border-[#1A1A1A] text-[#1A1A1A] px-10 py-4 rounded-sm font-medium tracking-wide text-sm hover:bg-[#1A1A1A] hover:text-[#F8F5F2] transition-colors"
            >
              VER TODO EL CATÁLOGO ({filteredProducts.length})
            </button>
          </div>
        )}

        {!hayFiltrosActivos && mostrarTodoElCatalogo && filteredProducts.length > LIMITE_CATALOGO_INICIAL && (
          <div className="text-center mt-14">
            <button
              onClick={() => {
                setMostrarTodoElCatalogo(false);
                document.getElementById("coleccion")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm text-[#C9A96E] underline hover:text-[#1A1A1A] transition-colors"
            >
              Mostrar menos
            </button>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-[#5A5A5A]">
            <p>No se encontraron perfumes con esos filtros.</p>
            <button onClick={limpiarFiltros} className="mt-4 text-[#C9A96E] underline">Ver todos</button>
          </div>
        )}
      </section>

      {/* TEST DE PERSONALIDAD OLFATIVA */}
      <section id="test" className="py-24 px-6 bg-[#F8F5F2]">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="text-[#C9A96E] text-sm font-semibold tracking-widest uppercase mb-3 block">Test Interactivo</span>
              <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-4">¿Cuál es tu aroma ideal?</h2>
              <p className="text-[#5A5A5A] max-w-xl mx-auto">Responde 4 preguntas y encuentra la fragancia perfecta que hable por ti.</p>
            </div>
          </FadeIn>

          <div className="rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] overflow-hidden border border-[#E8E8E8] min-h-[420px] flex flex-col md:flex-row">
            {quizStep < 4 ? (
              <>
                {/* Panel oscuro: número de pregunta + progreso */}
                <div className={`bg-[#1A1A1A] px-6 md:px-8 py-6 md:py-10 md:w-[38%] flex flex-row md:flex-col items-center md:items-start justify-between gap-4 transition-opacity duration-300 ${quizAnimating ? "opacity-0" : "opacity-100"}`}>
                  <div className="flex items-center gap-4 md:flex-col md:items-start">
                    <div className="w-11 h-11 rounded-full border border-[#C9A96E]/50 flex items-center justify-center flex-shrink-0 md:mb-6">
                      <img src="/images/logo-fraganti.png" alt="" className="w-6 h-6 object-contain opacity-80" />
                    </div>
                    <div>
                      <span className="font-sans text-[10px] tracking-[0.14em] uppercase text-[#C9A96E]">Pregunta</span>
                      <div className="font-serif text-4xl md:text-6xl leading-none text-[#F8F5F2] mt-1">
                        {String(quizStep + 1).padStart(2, "0")}
                      </div>
                      <div className="font-sans text-xs text-[#8A8A8A] mt-1">de 04</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 md:flex-col md:mt-10">
                    {[0, 1, 2, 3].map((step) => (
                      <div key={step} className={`w-5 h-[3px] md:w-5 md:h-[3px] rounded-full ${step <= quizStep ? "bg-[#C9A96E]" : "bg-[#444]"}`}></div>
                    ))}
                  </div>
                </div>

                {/* Panel claro: pregunta + respuestas */}
                <div className={`bg-[#F8F5F2] px-6 md:px-8 py-10 md:w-[62%] flex flex-col justify-center transition-opacity duration-300 ${quizAnimating ? "opacity-0" : "opacity-100"}`}>
                  <h3 className="font-serif text-2xl md:text-3xl text-[#1A1A1A] mb-6 leading-snug">
                    {QUIZ_QUESTIONS[quizStep].question}
                  </h3>
                  <div>
                    {QUIZ_QUESTIONS[quizStep].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuizAnswer(option)}
                        className="w-full flex items-baseline gap-4 py-4 border-b border-[#E5E0D5] last:border-b-0 text-left group hover:pl-1.5 transition-all duration-200"
                      >
                        <span className="font-serif text-sm text-[#C9A96E] flex-shrink-0">{String.fromCharCode(65 + idx)}</span>
                        <span className="font-medium text-[#333] group-hover:text-[#1A1A1A] transition-colors">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : quizMatch ? (
              <>
                {/* Panel oscuro: foto del match, más grande y centrada, con halo dorado */}
                <div className={`bg-[#1A1A1A] px-6 md:px-8 py-8 md:py-10 md:w-[38%] flex flex-row md:flex-col items-center justify-center gap-5 md:gap-0 text-left md:text-center transition-all duration-700 ease-out ${quizAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-[#C9A96E] rounded-full blur-2xl opacity-30"></div>
                    <div className="relative w-24 h-24 md:w-40 md:h-40 rounded-full border-2 border-[#C9A96E] overflow-hidden">
                      <img src={resolverImagen(quizMatch.image)} alt={quizMatch.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="md:mt-6">
                    <span className="inline-flex items-center gap-1.5 font-sans text-[10px] tracking-[0.14em] uppercase text-[#C9A96E]">
                      <Star size={11} fill="currentColor" /> Tu Match
                    </span>
                    <div className="font-serif text-xl md:text-2xl leading-tight text-[#F8F5F2] mt-1">Perfecto</div>
                  </div>
                </div>

                {/* Panel claro: detalle del perfume + CTA */}
                <div className={`bg-[#F8F5F2] px-6 md:px-8 py-10 md:w-[62%] flex flex-col justify-center transition-all duration-700 ease-out ${quizAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
                  <h3 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] mb-2">
                    {quizMatch.name}
                  </h3>
                  <p className="font-serif italic text-[#5A5A5A] mb-5 text-lg">
                    {quizMatch.family} · {quizMatch.notasCorta}
                  </p>
                  <p className="text-[#333] text-sm leading-relaxed mb-8">
                    Basado en tu estilo <strong>{quizAnswers[0]?.label.toLowerCase()}</strong> y tu preferencia por notas <strong>{quizAnswers[3]?.label.toLowerCase()}</strong>, esta fragancia de nuestra colección es la que mejor encaja contigo.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <button
                      onClick={() => setQuickViewId(quizMatch.id)}
                      className="btn-gold px-8 py-4 rounded-sm font-medium tracking-wide text-sm w-full sm:w-auto"
                    >
                      VER PERFUME
                    </button>
                    <button onClick={resetQuiz} className="text-[#A0A0A0] text-sm underline hover:text-[#1A1A1A] transition-colors">
                      Volver a empezar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full bg-[#F8F5F2] flex flex-col items-center justify-center text-center text-[#5A5A5A] py-20 px-8">
                <p className="mb-4">Todavía estamos cargando el catálogo — dale un segundo e inténtalo de nuevo.</p>
                <button onClick={resetQuiz} className="text-[#C9A96E] underline text-sm">Reintentar</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DECANTS SECTION — ahora con más protagonismo gráfico, ya que absorbe el espacio que dejó "Experiencia Sensorial" */}
      <section id="decants" className="relative py-28 md:py-36 overflow-hidden bg-[#1A1A1A]">
        <div className="absolute inset-0">
          <img
            src="/images/fraganti-decants.jpg"
            alt="Perfume Decants"
            className="w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/70 to-[#1A1A1A]/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/60 via-transparent to-[#1A1A1A]/60"></div>
          {/* Transiciones suaves hacia el hueso de Test olfativo (arriba) y Contacto (abajo) */}
          <div className="absolute top-0 inset-x-0 h-24 md:h-32 bg-gradient-to-b from-[#F8F5F2]/60 to-transparent"></div>
          <div className="absolute bottom-0 inset-x-0 h-24 md:h-32 bg-gradient-to-t from-[#F8F5F2]/60 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 text-center">
          <FadeIn>
            <span className="text-[#C9A96E] text-sm font-semibold tracking-widest uppercase mb-4 block">Prueba antes de comprar</span>
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-[#F8F5F2] font-light mb-6 leading-tight">
              Decants — <i className="italic text-[#C9A96E]">tu portal</i> al lujo.
            </h2>
            <p className="text-[#D9D5CC] text-lg md:text-xl mb-12 font-light max-w-2xl mx-auto">
              Prueba cualquier fragancia premium en presentaciones de <strong className="text-[#F8F5F2] font-medium">5ml y 10ml</strong> antes de invertir en el frasco completo. Portabilidad, exclusividad y la libertad de descubrir nuevos aromas.
            </p>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-16">
              <div className="flex items-center gap-2.5 bg-[#1C1C1C]/60 backdrop-blur-md border border-[#333] px-5 py-3 rounded-full">
                <Check size={16} className="text-[#C9A96E] shrink-0" />
                <span className="text-[#F8F5F2] text-sm font-light">100% originales garantizados</span>
              </div>
              <div className="flex items-center gap-2.5 bg-[#1C1C1C]/60 backdrop-blur-md border border-[#333] px-5 py-3 rounded-full">
                <Check size={16} className="text-[#C9A96E] shrink-0" />
                <span className="text-[#F8F5F2] text-sm font-light">
                  {precioDecantMinimo
                    ? <>Desde <strong className="text-[#C9A96E] font-medium">{formatearCOP(precioDecantMinimo)}</strong></>
                    : "Precios accesibles"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 bg-[#1C1C1C]/60 backdrop-blur-md border border-[#333] px-5 py-3 rounded-full">
                <Check size={16} className="text-[#C9A96E] shrink-0" />
                <span className="text-[#F8F5F2] text-sm font-light">Envíos en 24/48h a toda Colombia</span>
              </div>
            </div>
          </FadeIn>

          {/* Vitrina real de perfumes disponibles en decant — protagonista visual de la sección */}
          {productosConDecants.length > 0 ? (
            <FadeIn delay={250}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7 mb-14 max-w-5xl mx-auto">
                {productosConDecants.slice(0, 8).map((p, index) => {
                  const key = (["decant5", "decant10"] as const).find((k) => p.formatos[k].disponible)!;
                  const info = p.formatos[key];
                  return (
                    <FadeIn key={p.id} delay={300 + index * 80}>
                      <button
                        onClick={() => setQuickViewId(p.id)}
                        className="group w-full text-left"
                      >
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-[#F5F5DC]/10 mb-3 border border-[#333] group-hover:border-[#C9A96E]/70 transition-all duration-300 group-hover:-translate-y-1 shadow-lg shadow-black/20">
                          <img
                            src={resolverImagen(p.imagenAbierta || p.image)}
                            alt={p.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover mix-blend-luminosity opacity-90 group-hover:opacity-100 group-hover:mix-blend-normal transition-all duration-300"
                          />
                          <span className="absolute top-2.5 right-2.5 bg-[#C9A96E] text-[#1A1A1A] text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                            {key === "decant5" ? "5ML" : "10ML"}
                          </span>
                        </div>
                        <p className="text-[#F8F5F2] text-sm font-medium truncate group-hover:text-[#C9A96E] transition-colors">{p.name}</p>
                        <p className="text-[#A0A0A0] text-xs">{info.precio}</p>
                      </button>
                    </FadeIn>
                  );
                })}
              </div>
            </FadeIn>
          ) : (
            <FadeIn delay={250}>
              <p className="text-[#A0A0A0] text-sm mb-14 italic">Muy pronto verás aquí nuestra selección de decants disponibles.</p>
            </FadeIn>
          )}

          <FadeIn delay={400}>
            <button onClick={irADecants} className="btn-gold px-10 py-4 rounded-sm font-medium tracking-wide text-sm inline-block">
              EXPLORAR TODOS LOS DECANTS
            </button>
          </FadeIn>

          <FadeIn delay={480}>
            <p className="mt-8 text-[#8A8A8A] text-xs tracking-wide">
              Comparte tu decant y etiquétanos —{" "}
              <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[#C9A96E] hover:text-[#F8F5F2] transition-colors inline-flex items-center gap-1 align-middle">
                <Instagram size={13} />
              </a>
              {" / "}
              <a href={CONTACT.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-[#C9A96E] hover:text-[#F8F5F2] transition-colors inline-flex items-center gap-1 align-middle">
                <TikTokIcon size={12} />
              </a>
              {" "}@fraganti.co
            </p>
          </FadeIn>
        </div>
      </section>

      {/* CONTACTO Y UBICACIÓN */}
      <section id="contacto" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto bg-[#F8F5F2]">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-4">Estamos para asesorarte</h2>
            <div className="h-[1px] w-24 bg-[#C9A96E] mx-auto"></div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <FadeIn direction="right">
            <div className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-[#E8E8E8] h-full">
              <h3 className="font-serif text-2xl text-[#1A1A1A] mb-8 border-b border-[#F0F0F0] pb-4">Estamos ubicados en:</h3>
              
              <div className="space-y-8">
                <div className="flex items-start">
                  <MapPin className="text-[#C9A96E] mt-1 mr-4 shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] mb-1">Caucasia, Antioquia</h4>
                    <p className="text-[#5A5A5A] text-sm mb-1">{CONTACT.storeAddress}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="text-[#C9A96E] mt-1 mr-4 shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] mb-1">Medellín, Colombia</h4>
                    <p className="text-[#5A5A5A] text-sm mb-1">Domicilios en Medellín</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="text-[#C9A96E] mt-1 mr-4 shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] mb-1">Resto del país</h4>
                    <p className="text-[#5A5A5A] text-sm mb-1">Envíos a toda Colombia</p>
                  </div>
                </div>

                <div className="h-px bg-[#F0F0F0] my-2"></div>

                <div className="flex items-start">
                  <Clock className="text-[#C9A96E] mt-1 mr-4 shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] mb-1">Horarios de Atención</h4>
                    <p className="text-[#5A5A5A] text-sm mb-1">Lunes a Sábado: 9:00 am - 7:00 pm</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="text-[#C9A96E] mt-1 mr-4 shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] mb-1">Línea de Atención</h4>
                    <a href={`tel:${CONTACT.whatsappNumber}`} className="text-[#5A5A5A] text-sm hover:text-[#C9A96E] transition-colors">+57 324 269 5225</a>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="left">
            <div className="bg-[#1C1C1C] text-[#F8F5F2] p-8 md:p-12 rounded-lg h-full relative overflow-hidden flex flex-col">
              {/* Decorative corner element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A96E] opacity-10 rounded-bl-full pointer-events-none"></div>

              <h3 className="font-serif text-2xl mb-2 text-[#C9A96E]">Nuestra tienda</h3>
              <p className="text-[#A0A0A0] text-sm mb-6 font-light">{CONTACT.storeAddress}</p>

              <div className="relative flex-grow min-h-[280px] rounded-lg overflow-hidden border border-[#333]">
                <iframe
                  title="Ubicación de FRAGANTI en Caucasia"
                  src={CONTACT.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, position: "absolute", inset: 0, filter: "grayscale(0.3) contrast(1.1)" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>

                {/* Anillo dorado decorativo centrado sobre el pin del mapa,
                    para resaltar visualmente la tienda dentro del barrio. */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="map-ring w-20 h-20 rounded-full border-2 border-[#C9A96E]"></span>
                  <span className="map-ring map-ring-delay w-20 h-20 rounded-full border border-[#C9A96E]/60 absolute"></span>
                </div>
              </div>

              <p className="text-[#5A5A5A] text-xs mt-3 text-center">
                📍 Barrio Pueblo Nuevo, Caucasia
              </p>

              <a
                href={CONTACT.mapLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-gold py-4 rounded-sm font-medium tracking-wide text-sm mt-4 flex items-center justify-center gap-2"
              >
                <MapPin size={16} />
                CÓMO LLEGAR
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* RESEÑAS DE GOOGLE */}
      {RESENAS.length > 0 && (
        <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto bg-[#F8F5F2]">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="text-[#C9A96E] text-sm font-semibold tracking-widest uppercase mb-3 block">Lo que dicen de nosotros</span>
              <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-6">Reseñas en Google</h2>

              <div className="inline-flex items-center gap-3 bg-white border border-[#E8E8E8] rounded-full px-6 py-3 shadow-sm">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={18}
                      className="text-[#C9A96E]"
                      fill={n <= Math.round(resumenGoogle.promedio) ? "currentColor" : "none"}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <span className="font-serif text-xl text-[#1A1A1A]">{resumenGoogle.promedio}</span>
                <span className="text-[#5A5A5A] text-sm">
                  ({resumenGoogle.total} {resumenGoogle.total === 1 ? "reseña" : "reseñas"})
                </span>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RESENAS.slice(0, 6).map((r, index) => (
              <FadeIn key={r.id} delay={index * 100}>
                <div className="bg-white p-6 rounded-lg border border-[#E8E8E8] h-full flex flex-col shadow-sm">
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={14} className="text-[#C9A96E]" fill={n <= r.calificacion ? "currentColor" : "none"} strokeWidth={1.5} />
                    ))}
                  </div>
                  <p className="text-[#333] text-sm leading-relaxed mb-4 flex-grow">"{r.texto}"</p>
                  <div className="flex items-center justify-between pt-3 border-t border-[#F0F0F0]">
                    <span className="font-medium text-[#1A1A1A] text-sm">{r.autor}</span>
                    {r.fechaTexto && <span className="text-[#A0A0A0] text-xs">{r.fechaTexto}</span>}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={300}>
            <div className="text-center mt-10">
              <a
                href={CONTACT.mapLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline px-8 py-3 rounded-sm font-medium tracking-wide text-sm inline-flex items-center gap-2"
              >
                Ver todas las reseñas en Google <ChevronRight size={16} />
              </a>
            </div>
          </FadeIn>
        </section>
      )}
      <footer className="bg-[#1A1A1A] border-t border-[#333] pt-20 pb-10 px-6 lg:px-12 text-[#A0A0A0] font-light">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            {/* Col 1: Brand */}
            <div>
              <h2 className="font-serif text-2xl text-[#C9A96E] tracking-[0.15em] mb-4">FRAGANTI</h2>
              <p className="text-[#F8F5F2] font-medium mb-1">Tu esencia, nuestro arte.</p>
              <p className="text-sm mb-6 italic font-serif">Auténtica perfumería de lujo en Colombia.</p>
              
              <span className="block text-[11px] font-semibold uppercase tracking-widest text-[#5A5A5A] mb-3">Síguenos</span>
              <div className="flex space-x-4">
                <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center hover:bg-[#C9A96E] hover:text-[#1A1A1A] hover:border-[#C9A96E] transition-all">
                  <Instagram size={18} />
                </a>
                <a href={CONTACT.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center hover:bg-[#C9A96E] hover:text-[#1A1A1A] hover:border-[#C9A96E] transition-all">
                  <TikTokIcon size={18} />
                </a>
              </div>
            </div>

            {/* Col 2: Links */}
            <div>
              <h3 className="text-[#F8F5F2] font-medium tracking-widest text-sm uppercase mb-6">Enlaces Rápidos</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#coleccion" className="hover:text-[#C9A96E] transition-colors">Colección Completa</a></li>
                <li><a href="#decants" className="hover:text-[#C9A96E] transition-colors">Descubre los Decants</a></li>
                <li><a href="#test" className="hover:text-[#C9A96E] transition-colors">Test Olfativo</a></li>
                <li><a href="#" className="hover:text-[#C9A96E] transition-colors">Sobre Nosotros</a></li>
                <li><a href="#contacto" className="hover:text-[#C9A96E] transition-colors">Contacto</a></li>
              </ul>
            </div>

            {/* Col 3: Contact */}
            <div>
              <h3 className="text-[#F8F5F2] font-medium tracking-widest text-sm uppercase mb-6">Atención al Cliente</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-[#C9A96E]" />
                  <a href={`tel:${CONTACT.whatsappNumber}`} className="hover:text-[#C9A96E] transition-colors">+57 324 269 5225</a>
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle size={14} className="text-[#C9A96E]" />
                  <a href={CONTACT.whatsappAutoReplyLink} target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A96E] transition-colors">WhatsApp Disponible</a>
                </li>
                <li className="mt-4 text-[#F8F5F2]">Caucasia · Domicilios en Medellín · Envíos a toda Colombia</li>
              </ul>
            </div>

            {/* Col 4: Newsletter */}
            <div>
              <h3 className="text-[#F8F5F2] font-medium tracking-widest text-sm uppercase mb-6">Newsletter</h3>
              <p className="text-sm mb-4">Únete a la comunidad Fraganti y recibe novedades y ofertas exclusivas.</p>
              <form className="flex" onSubmit={e => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Tu correo" 
                  className="bg-[#2A2A2A] text-white px-4 py-2 w-full text-sm outline-none border border-[#333] focus:border-[#C9A96E] rounded-l-sm"
                />
                <button type="submit" className="bg-[#C9A96E] text-[#1A1A1A] px-4 py-2 text-sm font-medium hover:bg-[#D4AF37] transition-colors rounded-r-sm">
                  SUSCRIBIR
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-[#333] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs">© 2026 FRAGANTI. Todos los derechos reservados.</p>
            
            <div className="flex gap-4 md:gap-6 text-[10px] md:text-xs font-medium uppercase tracking-widest text-[#F8F5F2]">
              <span className="flex items-center gap-1"><Check size={12} className="text-[#C9A96E]" /> 100% Autenticidad</span>
              <span className="flex items-center gap-1"><Check size={12} className="text-[#C9A96E]" /> Pago Seguro</span>
              <span className="flex items-center gap-1"><Check size={12} className="text-[#C9A96E]" /> Envíos a toda Colombia</span>
            </div>

            <div className="flex gap-4 text-xs">
              <a href="#" className="hover:text-[#F8F5F2]">Privacidad</a>
              <a href="#" className="hover:text-[#F8F5F2]">Términos</a>
            </div>
          </div>
        </div>
      </footer>

      {/* FLOATING ELEMENTS */}
      
      {/* Mobile Sticky CTA - Appears when scrolled down */}
      <div className={`md:hidden fixed bottom-0 left-0 w-full bg-[#1A1A1A] p-4 border-t border-[#333] z-40 transition-transform duration-300 ${isScrolled ? 'translate-y-0' : 'translate-y-full'}`}>
        <a
          href="#coleccion"
          className="w-full btn-gold py-3 rounded-sm font-medium text-sm shadow-[0_0_15px_rgba(201,169,110,0.3)] flex items-center justify-center"
        >
          VER CATÁLOGO COMPLETO
        </a>
      </div>

      {/* WhatsApp Floating Button */}
      <a 
        href={CONTACT.whatsappAutoReplyLink} 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-24 md:bottom-8 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
      >
        <MessageCircle size={28} />
        {/* Tooltip */}
        <span className="absolute right-full mr-4 bg-[#1A1A1A] text-white text-xs py-2 px-3 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Asesoría por WhatsApp
        </span>
      </a>

      {/* Phone Call Floating Button (Desktop only, stacked above WA) */}
      <a 
        href={`tel:${CONTACT.whatsappNumber}`}
        className="hidden md:flex fixed bottom-24 right-6 z-50 bg-[#1A1A1A] text-[#F8F5F2] border border-[#333] p-3 rounded-full shadow-lg hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all duration-300 items-center justify-center group"
      >
        <Phone size={20} />
        {/* Tooltip */}
        <span className="absolute right-full mr-4 bg-[#1A1A1A] text-white text-xs py-2 px-3 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Llámanos
        </span>
      </a>

      {/* QUICK VIEW MODAL — pirámide olfativa de Fragantica */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewId(null)} onInspiradoClick={filtrarPorInspirado} />

      {/* CARRITO */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} whatsappNumber={CONTACT.whatsappNumber} />

    </div>
  );
}
