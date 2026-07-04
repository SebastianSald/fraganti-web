import React, { useState, useEffect, useRef } from "react";
import { 
  Menu, X, Search, ShoppingBag, ChevronRight, Phone, 
  MessageCircle, ArrowDown, MapPin, Clock, 
  Instagram, Check, Droplets, Star
} from "lucide-react";
import {
  loadPerfumes, FAMILIAS_CATALOGO, GENEROS_CATALOGO, QUIZ_QUESTIONS, calcularMatchDelQuiz,
  formatosOfrecidos, perfumeAgotado, primerFormatoDisponible, FORMATO_LABELS,
  type Perfume, type FormatoKey, type Genero, type QuizOption,
} from "../data/perfumes";
import { useCart, parsePrecioCOP, formatearCOP } from "../context/CartContext";
import { CartDrawer } from "./CartDrawer";
import { QuickViewModal } from "./QuickViewModal";

/** Quita tildes y pasa a minúsculas, para que buscar "yara" encuentre "Yara" o "yará". */
function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Precio de referencia para ordenar por precio: el del primer formato que el perfume ofrezca. */
function precioReferencia(p: Perfume): number {
  const key = primerFormatoDisponible(p) ?? (["completo", "decant5", "decant10"] as const).find((k) => p.formatos[k]?.disponible);
  if (!key) return Number.POSITIVE_INFINITY;
  const precio = parsePrecioCOP(p.formatos[key].precio);
  return precio > 0 ? precio : Number.POSITIVE_INFINITY;
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

// Tarjeta de producto individual — maneja su propio formato seleccionado
// (Completo / Decant 5ml / Decant 10ml) y refleja el stock de cada uno.
function ProductCard({
  product,
  delay,
  onQuickView,
}: {
  product: Perfume;
  delay: number;
  onQuickView: () => void;
}) {
  const ofrecidos = formatosOfrecidos(product);
  const agotado = perfumeAgotado(product);
  const [selected, setSelected] = useState<FormatoKey | null>(() => primerFormatoDisponible(product));
  const { addToCart } = useCart();
  const [agregado, setAgregado] = useState(false);

  const selectedInfo = selected ? product.formatos[selected] : null;
  const selectedSinStock = !selectedInfo || selectedInfo.stock <= 0;

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
        {agotado && (
          <span className="absolute top-6 left-6 z-10 bg-[#5A5A5A] text-white text-[10px] font-bold px-3 py-1 tracking-widest rounded-sm">
            AGOTADO
          </span>
        )}

        <div className="product-image-container relative h-72 mb-8 bg-[#F5F5DC]/30 rounded-md overflow-hidden flex items-center justify-center">
          <img
            src={`/images/${product.image}`}
            alt={product.name}
            className="w-full h-full object-cover mix-blend-multiply"
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
          <span className="text-[#C9A96E] text-xs font-semibold tracking-widest uppercase mb-2">{product.family}</span>
          <h3 className="font-serif text-2xl text-[#1A1A1A] mb-1">{product.name}</h3>
          <p className="text-[#5A5A5A] text-sm italic mb-4 flex-grow font-serif">{product.notasCorta}</p>

          {/* Selector de formato: solo se muestran los que el negocio ofrece */}
          {ofrecidos.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {ofrecidos.map((key) => {
                const info = product.formatos[key];
                const sinStock = info.stock <= 0;
                const isSelected = selected === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={sinStock}
                    onClick={() => setSelected(key)}
                    className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs border transition-all ${
                      sinStock
                        ? "border-[#E0E0E0] text-[#B0B0B0] bg-[#F5F5F5] cursor-not-allowed line-through"
                        : isSelected
                        ? "bg-[#1A1A1A] text-[#F8F5F2] border-[#1A1A1A]"
                        : "border-[#d1cec7] text-[#5A5A5A] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                    }`}
                  >
                    {FORMATO_LABELS[key]}{sinStock ? " · Agotado" : ""}
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-[#1A1A1A] font-medium tracking-wide mb-6">
            {!agotado && selectedInfo && !selectedSinStock ? selectedInfo.precio : "Agotado"}
          </p>

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Búsqueda, orden y filtros de la colección
  const [searchTerm, setSearchTerm] = useState("");
  const [orden, setOrden] = useState<OrdenCatalogo>("relevancia");
  const [filtroFamilias, setFiltroFamilias] = useState<string[]>([]);
  const [filtroGeneros, setFiltroGeneros] = useState<Genero[]>([]);
  const [filtroAromas, setFiltroAromas] = useState<string[]>([]);
  const [soloDecants, setSoloDecants] = useState(false);
  const [panelFiltrosAbierto, setPanelFiltrosAbierto] = useState(false);
  
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizOption[]>([]);
  const [quizAnimating, setQuizAnimating] = useState(false);

  const [quickViewId, setQuickViewId] = useState<number | null>(null);
  const [PRODUCTS, setPRODUCTS] = useState<Perfume[]>([]);
  const quickViewProduct = PRODUCTS.find(p => p.id === quickViewId) ?? null;
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cantidadTotal } = useCart();

  useEffect(() => {
    loadPerfumes()
      .then(setPRODUCTS)
      .catch((err) => console.error("Error cargando el catálogo:", err));
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
  const todosLosAromas = React.useMemo(() => {
    const set = new Set<string>();
    PRODUCTS.forEach((p) => {
      [...p.notas.salida, ...p.notas.corazon, ...p.notas.fondo].forEach((n) => set.add(n));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [PRODUCTS]);

  const toggleEnLista = <T,>(lista: T[], valor: T): T[] =>
    lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

  const hayFiltrosActivos = filtroFamilias.length > 0 || filtroGeneros.length > 0 || filtroAromas.length > 0 || soloDecants || searchTerm.trim() !== "";

  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltroFamilias([]);
    setFiltroGeneros([]);
    setFiltroAromas([]);
    setSoloDecants(false);
    setOrden("relevancia");
  };

  const filteredProducts = React.useMemo(() => {
    let lista = PRODUCTS;

    if (searchTerm.trim()) {
      const termino = normalizarTexto(searchTerm.trim());
      lista = lista.filter((p) => normalizarTexto(p.name).includes(termino));
    }

    if (filtroFamilias.length > 0) {
      lista = lista.filter((p) => filtroFamilias.includes(p.family));
    }

    if (filtroGeneros.length > 0) {
      lista = lista.filter((p) => filtroGeneros.includes(p.genero));
    }

    if (filtroAromas.length > 0) {
      lista = lista.filter((p) => {
        const notasPerfume = [...p.notas.salida, ...p.notas.corazon, ...p.notas.fondo];
        return filtroAromas.some((aroma) => notasPerfume.includes(aroma));
      });
    }

    if (soloDecants) {
      lista = lista.filter((p) => p.formatos.decant5.disponible || p.formatos.decant10.disponible);
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
        break; // "relevancia" = orden original del catálogo (más recientes primero)
    }

    return ordenada;
  }, [PRODUCTS, searchTerm, filtroFamilias, filtroGeneros, filtroAromas, soloDecants, orden]);

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

  const irADecants = () => {
    limpiarFiltros();
    setSoloDecants(true);
    setTimeout(() => {
      document.getElementById("coleccion")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // Perfume real del catálogo que mejor encaja con las respuestas del test.
  const quizMatch = React.useMemo(() => {
    if (quizAnswers.length < QUIZ_QUESTIONS.length) return null;
    return calcularMatchDelQuiz(quizAnswers, PRODUCTS);
  }, [quizAnswers, PRODUCTS]);

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
          <a href="#" className={`flex items-center gap-2.5 md:gap-3 font-serif text-2xl md:text-3xl font-medium tracking-[0.15em] transition-colors duration-300 ${isScrolled ? "text-[#C9A96E]" : "text-[#C9A96E] md:text-[#F8F5F2]"}`}>
            <img
              src="/images/logo-fraganti.png"
              alt="FRAGANTI"
              className="h-8 md:h-10 w-auto object-contain"
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
          <div className="flex items-center space-x-4">
            <button className={`hover:text-[#C9A96E] transition-colors ${isScrolled ? "text-[#F8F5F2]" : "text-[#F8F5F2]"}`}>
              <Search size={20} />
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Ver carrito"
              className={`hover:text-[#C9A96E] transition-colors relative ${isScrolled ? "text-[#F8F5F2]" : "text-[#F8F5F2]"}`}
            >
              <ShoppingBag size={20} />
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
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar perfume por nombre..."
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

            {/* Filtro rápido por familia olfativa */}
            <div className="flex flex-wrap justify-center gap-3 w-full pb-2">
              {FAMILIAS_CATALOGO.map((familia) => (
                <button
                  key={familia}
                  onClick={() => setFiltroFamilias((prev) => toggleEnLista(prev, familia))}
                  className={`px-5 py-2 rounded-full text-sm transition-all duration-300 ${
                    filtroFamilias.includes(familia)
                    ? "bg-[#1A1A1A] text-[#F8F5F2] border border-[#1A1A1A]"
                    : "bg-transparent text-[#5A5A5A] border border-[#d1cec7] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                  }`}
                >
                  {familia}
                </button>
              ))}
              <button
                onClick={() => setSoloDecants((v) => !v)}
                className={`px-5 py-2 rounded-full text-sm border transition-all duration-300 flex items-center gap-1.5 ${
                  soloDecants
                  ? "bg-[#1A1A1A] text-[#F8F5F2] border-[#1A1A1A]"
                  : "bg-transparent text-[#5A5A5A] border-[#d1cec7] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                }`}
              >
                <Droplets size={14} /> Solo Decants
              </button>
              <button
                onClick={() => setPanelFiltrosAbierto((v) => !v)}
                className={`px-5 py-2 rounded-full text-sm border transition-all duration-300 flex items-center gap-1.5 ${
                  panelFiltrosAbierto || filtroGeneros.length > 0 || filtroAromas.length > 0
                  ? "bg-[#C9A96E] text-[#1A1A1A] border-[#C9A96E]"
                  : "bg-transparent text-[#5A5A5A] border-[#d1cec7] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                }`}
              >
                Más filtros {(filtroGeneros.length + filtroAromas.length) > 0 && `(${filtroGeneros.length + filtroAromas.length})`}
              </button>
            </div>

            {/* Panel de filtros avanzados: género + aroma */}
            {panelFiltrosAbierto && (
              <div className="w-full max-w-3xl bg-white border border-[#E5E0D5] rounded-lg p-6 mt-4 text-left">
                <div className="mb-5">
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
                  <span className="block text-xs font-semibold uppercase tracking-widest text-[#B89250] mb-2.5">Aroma</span>
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
              </div>
            )}

            {hayFiltrosActivos && (
              <button onClick={limpiarFiltros} className="mt-4 text-sm text-[#C9A96E] underline hover:text-[#1A1A1A] transition-colors">
                Limpiar todos los filtros
              </button>
            )}
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              delay={index * 150}
              onQuickView={() => setQuickViewId(product.id)}
            />
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-[#5A5A5A]">
            <p>No se encontraron perfumes con esos filtros.</p>
            <button onClick={limpiarFiltros} className="mt-4 text-[#C9A96E] underline">Ver todos</button>
          </div>
        )}
      </section>

      {/* TEST DE PERSONALIDAD OLFATIVA */}
      <section id="test" className="py-24 px-6 bg-[#F5F5DC]/40 border-y border-[#E5E0D5]">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="text-[#C9A96E] text-sm font-semibold tracking-widest uppercase mb-3 block">Test Interactivo</span>
              <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-4">¿Cuál es tu aroma ideal?</h2>
              <p className="text-[#5A5A5A] max-w-xl mx-auto">Responde 4 preguntas y encuentra la fragancia perfecta que hable por ti.</p>
            </div>
          </FadeIn>

          <div className="bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-8 md:p-12 relative overflow-hidden min-h-[400px] flex flex-col justify-center border border-[#E8E8E8]">
            {quizStep < 4 ? (
              <div className={`transition-opacity duration-300 w-full ${quizAnimating ? "opacity-0" : "opacity-100"}`}>
                <div className="flex justify-between items-center mb-8">
                  <span className="text-sm font-medium text-[#A0A0A0]">Pregunta {quizStep + 1} de 4</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(step => (
                      <div key={step} className={`h-1 w-8 rounded-full ${step <= quizStep ? "bg-[#C9A96E]" : "bg-[#F0F0F0]"}`}></div>
                    ))}
                  </div>
                </div>
                
                <h3 className="font-serif text-2xl md:text-3xl text-[#1A1A1A] mb-8 text-center">
                  {QUIZ_QUESTIONS[quizStep].question}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {QUIZ_QUESTIONS[quizStep].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(option)}
                      className="px-6 py-5 rounded-lg border border-[#E0E0E0] text-left hover:border-[#C9A96E] hover:bg-[#FDFBF7] hover:shadow-sm transition-all group relative overflow-hidden"
                    >
                      <span className="relative z-10 font-medium text-[#333] group-hover:text-[#1A1A1A]">{option.label}</span>
                      <div className="absolute top-0 right-0 h-full w-1 bg-[#C9A96E] transform translate-x-full group-hover:translate-x-0 transition-transform"></div>
                    </button>
                  ))}
                </div>
              </div>
            ) : quizMatch ? (
              <div className={`transition-all duration-700 ease-out flex flex-col md:flex-row gap-8 items-center ${quizAnimating ? "opacity-0 scale-95 blur-sm" : "opacity-100 scale-100 blur-0"}`}>
                <div className="w-full md:w-1/2 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#C9A96E] rounded-full blur-[60px] opacity-20"></div>
                    <img
                      src={`/images/${quizMatch.image}`}
                      alt={quizMatch.name}
                      className="w-48 h-48 object-cover rounded-full relative z-10 drop-shadow-2xl border-4 border-white"
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/2 text-center md:text-left">
                  <span className="inline-flex items-center gap-2 text-[#C9A96E] text-xs font-semibold tracking-widest uppercase mb-4 bg-[#FDFBF7] px-3 py-1 rounded-full border border-[#C9A96E]/20">
                    <Star size={12} fill="currentColor" /> Tu Match Perfecto
                  </span>
                  <h3 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] mb-2">
                    {quizMatch.name}
                  </h3>
                  <p className="font-serif italic text-[#5A5A5A] mb-6 text-lg">
                    {quizMatch.family} · {quizMatch.notasCorta}
                  </p>
                  <p className="text-[#333] text-sm leading-relaxed mb-8">
                    Basado en tu estilo <strong>{quizAnswers[0]?.label.toLowerCase()}</strong> y tu preferencia por notas <strong>{quizAnswers[3]?.label.toLowerCase()}</strong>, esta fragancia de nuestra colección es la que mejor encaja contigo.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center">
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
              </div>
            ) : (
              <div className="text-center text-[#5A5A5A]">
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
                            src={`/images/${p.image}`}
                            alt={p.name}
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
        </div>
      </section>

      {/* CONTACTO Y UBICACIÓN */}
      <section id="contacto" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
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

      {/* FOOTER */}
      <footer className="bg-[#1A1A1A] border-t border-[#333] pt-20 pb-10 px-6 lg:px-12 text-[#A0A0A0] font-light">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            {/* Col 1: Brand */}
            <div>
              <h2 className="font-serif text-2xl text-[#C9A96E] tracking-[0.15em] mb-4">FRAGANTI</h2>
              <p className="text-[#F8F5F2] font-medium mb-1">Tu esencia, nuestro arte.</p>
              <p className="text-sm mb-6 italic font-serif">Auténtica perfumería de lujo en Colombia.</p>
              
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
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewId(null)} />

      {/* CARRITO */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} whatsappNumber={CONTACT.whatsappNumber} />

    </div>
  );
}
