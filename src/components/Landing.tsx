import React, { useState, useEffect, useRef } from "react";
import { 
  Menu, X, Search, ShoppingBag, ChevronRight, Phone, 
  MessageCircle, ArrowDown, MapPin, Mail, Clock, 
  Instagram, Youtube, Check, Droplets, TreePine, 
  Sparkles, Citrus, Star
} from "lucide-react";
import { loadPerfumes, FAMILIES, QUIZ_QUESTIONS, type Perfume } from "../data/perfumes";
import { QuickViewModal } from "./QuickViewModal";

const FAMILY_ICONS: Record<string, React.ReactNode> = {
  Floral: <Sparkles className="w-8 h-8 text-[#C9A96E]" />,
  Amaderado: <TreePine className="w-8 h-8 text-[#C9A96E]" />,
  Cítrico: <Citrus className="w-8 h-8 text-[#C9A96E]" />,
  Oriental: <Droplets className="w-8 h-8 text-[#C9A96E]" />,
};

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

export function Landing() {
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Todos");
  
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizAnimating, setQuizAnimating] = useState(false);

  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [formStatus, setFormStatus] = useState<"idle" | "success">("idle");

  const [quickViewId, setQuickViewId] = useState<number | null>(null);
  const [PRODUCTS, setPRODUCTS] = useState<Perfume[]>([]);
  const quickViewProduct = PRODUCTS.find(p => p.id === quickViewId) ?? null;

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

  const handleQuizAnswer = (answer: string) => {
    if (quizAnimating) return;
    setQuizAnimating(true);
    setTimeout(() => {
      setQuizAnswers([...quizAnswers, answer]);
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

  const isFormValid = formState.name.length > 2 && formState.email.includes("@") && formState.message.length > 5;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      setFormStatus("success");
      setTimeout(() => {
        setFormState({ name: "", email: "", message: "" });
        setFormStatus("idle");
      }, 3000);
    }
  };

  const filteredProducts = activeFilter === "Todos" 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.family.includes(activeFilter) || p.family === activeFilter);

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
          <h1 className="loader-logo font-serif text-4xl md:text-6xl text-[#F8F5F2] tracking-[0.2em] font-light z-10 relative">
            FRAGANTI
          </h1>
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
          <a href="#" className={`font-serif text-2xl md:text-3xl font-medium tracking-[0.15em] transition-colors duration-300 ${isScrolled ? "text-[#C9A96E]" : "text-[#C9A96E] md:text-[#F8F5F2]"}`}>
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
            <button className={`hover:text-[#C9A96E] transition-colors relative ${isScrolled ? "text-[#F8F5F2]" : "text-[#F8F5F2]"}`}>
              <ShoppingBag size={20} />
              <span className="absolute -top-1 -right-2 bg-[#C9A96E] text-[#1A1A1A] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
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
          <div className="flex flex-col items-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-4 text-center">Nuestra Colección</h2>
            <div className="h-[1px] w-24 bg-[#C9A96E] mb-10"></div>
            
            {/* Filters */}
            <div className="flex flex-wrap justify-center gap-3 w-full custom-scrollbar pb-2">
              {["Todos", "Oriental", "Floral", "Amaderada", "Fresca"].map(filter => (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-6 py-2 rounded-full text-sm transition-all duration-300 ${
                    activeFilter === filter 
                    ? "bg-[#1A1A1A] text-[#F8F5F2] border border-[#1A1A1A]" 
                    : "bg-transparent text-[#5A5A5A] border border-[#d1cec7] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredProducts.map((product, index) => (
            <FadeIn key={product.id} delay={index * 150} direction="up">
              <div className="product-card group cursor-pointer bg-white rounded-lg p-6 flex flex-col h-full relative overflow-hidden">
                {product.isNew && (
                  <span className="absolute top-6 left-6 z-10 bg-[#C9A96E] text-[#1A1A1A] text-[10px] font-bold px-3 py-1 tracking-widest rounded-sm">
                    NUEVO
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
                      onClick={() => setQuickViewId(product.id)}
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
                  <p className="text-[#1A1A1A] font-medium tracking-wide mb-6">{product.price}</p>
                  
                  <button className="w-full btn-outline py-3 rounded-sm text-sm tracking-widest font-medium group-hover:bg-[#1A1A1A] group-hover:text-[#F8F5F2]">
                    AGREGAR AL CARRITO
                  </button>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-[#5A5A5A]">
            <p>No se encontraron perfumes en esta categoría.</p>
            <button onClick={() => setActiveFilter("Todos")} className="mt-4 text-[#C9A96E] underline">Ver todos</button>
          </div>
        )}
      </section>

      {/* EXPERIENCIA SENSORIAL */}
      <section className="relative py-32 overflow-hidden bg-[#1A1A1A]">
        <div className="absolute inset-0">
          <img 
            src="/images/fraganti-sensory.jpg" 
            alt="Sensory background" 
            className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-[#1A1A1A]"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <FadeIn>
            <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-[#F8F5F2] font-light leading-snug mb-16 max-w-4xl mx-auto">
              Cada aroma es una <i className="italic text-[#C9A96E]">memoria</i>.<br />
              Cada fragancia, una <i className="italic text-[#C9A96E]">emoción</i>.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {FAMILIES.map((family, index) => (
              <FadeIn key={family.name} delay={index * 150} className="bg-[#1C1C1C]/60 backdrop-blur-md border border-[#333] p-8 rounded-lg flex flex-col items-center text-center hover:border-[#C9A96E]/50 transition-colors duration-300">
                <div className="mb-6 bg-[#2A2A2A] w-16 h-16 rounded-full flex items-center justify-center">
                  {FAMILY_ICONS[family.name]}
                </div>
                <h3 className="font-serif text-xl text-[#F8F5F2] mb-2">{family.name}</h3>
                <p className="text-[#A0A0A0] text-sm">{family.notes}</p>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={600}>
            <button className="btn-outline-cream px-10 py-4 rounded-sm font-medium tracking-widest text-sm hover:border-[#C9A96E] hover:text-[#C9A96E] hover:bg-transparent">
              DESCUBRE TU FAMILIA OLFATIVA
            </button>
          </FadeIn>
        </div>
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
                      <span className="relative z-10 font-medium text-[#333] group-hover:text-[#1A1A1A]">{option}</span>
                      <div className="absolute top-0 right-0 h-full w-1 bg-[#C9A96E] transform translate-x-full group-hover:translate-x-0 transition-transform"></div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`transition-all duration-700 ease-out flex flex-col md:flex-row gap-8 items-center ${quizAnimating ? "opacity-0 scale-95 blur-sm" : "opacity-100 scale-100 blur-0"}`}>
                <div className="w-full md:w-1/2 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#C9A96E] rounded-full blur-[60px] opacity-20"></div>
                    <img 
                      src={`/images/${quizAnswers[3] === "Floral" ? "fraganti-prod2.jpg" : quizAnswers[3] === "Amaderado" ? "fraganti-prod3.jpg" : "fraganti-prod1.jpg"}`}
                      alt="Tu perfume ideal" 
                      className="w-48 h-auto relative z-10 mix-blend-multiply drop-shadow-2xl"
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/2 text-center md:text-left">
                  <span className="inline-flex items-center gap-2 text-[#C9A96E] text-xs font-semibold tracking-widest uppercase mb-4 bg-[#FDFBF7] px-3 py-1 rounded-full border border-[#C9A96E]/20">
                    <Star size={12} fill="currentColor" /> Tu Match Perfecto
                  </span>
                  <h3 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] mb-2">
                    {quizAnswers[3] === "Floral" ? "Fleur de Jasmin" : quizAnswers[3] === "Amaderado" ? "Terre d'Hermès" : "Oud Noir"}
                  </h3>
                  <p className="font-serif italic text-[#5A5A5A] mb-6 text-lg">
                    Basado en tu estilo {quizAnswers[0]?.toLowerCase()} y preferencia {quizAnswers[3]?.toLowerCase()}.
                  </p>
                  <p className="text-[#333] text-sm leading-relaxed mb-8">
                    Esta fragancia captura la esencia que buscas para una {quizAnswers[1]?.toLowerCase()}. Sus notas envuelven con un toque {quizAnswers[2]?.toLowerCase()}, creando un aura inolvidable.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center">
                    <button className="btn-gold px-8 py-4 rounded-sm font-medium tracking-wide text-sm w-full sm:w-auto">
                      VER PERFUME
                    </button>
                    <button onClick={resetQuiz} className="text-[#A0A0A0] text-sm underline hover:text-[#1A1A1A] transition-colors">
                      Volver a empezar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DECANTS SECTION */}
      <section id="decants" className="py-0 flex flex-col lg:flex-row bg-[#1A1A1A] overflow-hidden">
        <div className="w-full lg:w-1/2 h-[50vh] lg:h-auto relative">
          <img 
            src="/images/fraganti-decants.jpg" 
            alt="Perfume Decants" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1A1A1A] hidden lg:block opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent lg:hidden opacity-90"></div>
        </div>
        
        <div className="w-full lg:w-1/2 py-20 px-8 md:px-16 flex flex-col justify-center">
          <FadeIn direction="left">
            <span className="text-[#C9A96E] text-sm font-semibold tracking-widest uppercase mb-4 block">Prueba antes de comprar</span>
            <h2 className="font-serif text-4xl md:text-5xl text-[#F8F5F2] mb-6 leading-tight">Decants — Tu portal al lujo</h2>
            
            <p className="text-[#A0A0A0] text-lg mb-10 font-light max-w-lg">
              Prueba cualquier fragancia premium en presentaciones de <strong className="text-[#F8F5F2] font-medium">5ml y 10ml</strong> antes de invertir en el frasco completo. Portabilidad, exclusividad y la libertad de descubrir nuevos aromas.
            </p>
            
            <ul className="space-y-4 mb-10">
              <li className="flex items-center text-[#F8F5F2]">
                <Check size={18} className="text-[#C9A96E] mr-3 shrink-0" />
                <span className="font-light">Frascos atomizadores 100% originales garantizados</span>
              </li>
              <li className="flex items-center text-[#F8F5F2]">
                <Check size={18} className="text-[#C9A96E] mr-3 shrink-0" />
                <span className="font-light">Opciones de lujo desde $25.000 COP</span>
              </li>
              <li className="flex items-center text-[#F8F5F2]">
                <Check size={18} className="text-[#C9A96E] mr-3 shrink-0" />
                <span className="font-light">Envío rápido a nivel nacional en 24/48 horas</span>
              </li>
            </ul>
            
            <button className="btn-gold px-10 py-4 rounded-sm font-medium tracking-wide text-sm inline-block">
              EXPLORAR DECANTS
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
              <h3 className="font-serif text-2xl text-[#1A1A1A] mb-8 border-b border-[#F0F0F0] pb-4">Nuestras Boutiques</h3>
              
              <div className="space-y-8">
                <div className="flex items-start">
                  <MapPin className="text-[#C9A96E] mt-1 mr-4 shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] mb-1">Medellín, Colombia</h4>
                    <p className="text-[#5A5A5A] text-sm mb-1">Carrera 70 #45-12, Sector Laureles</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="text-[#C9A96E] mt-1 mr-4 shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] mb-1">Caucasia, Antioquia</h4>
                    <p className="text-[#5A5A5A] text-sm mb-1">Calle 20 #10-5, Centro</p>
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
                    <a href="tel:+573001234567" className="text-[#5A5A5A] text-sm hover:text-[#C9A96E] transition-colors">+57 300 123 4567</a>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="text-[#C9A96E] mt-1 mr-4 shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] mb-1">Correo Electrónico</h4>
                    <a href="mailto:fraganti.col@gmail.com" className="text-[#5A5A5A] text-sm hover:text-[#C9A96E] transition-colors">fraganti.col@gmail.com</a>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="left">
            <div className="bg-[#1C1C1C] text-[#F8F5F2] p-8 md:p-12 rounded-lg h-full relative overflow-hidden">
              {/* Decorative corner element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A96E] opacity-10 rounded-bl-full pointer-events-none"></div>
              
              <h3 className="font-serif text-2xl mb-2 text-[#C9A96E]">Envíanos un mensaje</h3>
              <p className="text-[#A0A0A0] text-sm mb-8 font-light">¿Buscas un perfume en específico? Te asesoramos.</p>
              
              {formStatus === "success" ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 bg-[#C9A96E]/20 text-[#C9A96E] rounded-full flex items-center justify-center mb-6">
                    <Check size={32} />
                  </div>
                  <h4 className="font-serif text-2xl text-[#F8F5F2] mb-2">Mensaje Enviado</h4>
                  <p className="text-[#A0A0A0] font-light">Nos pondremos en contacto contigo a la brevedad.</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-widest mb-2">Nombre Completo</label>
                    <input 
                      type="text" 
                      id="name"
                      value={formState.name}
                      onChange={e => setFormState({...formState, name: e.target.value})}
                      className={`w-full bg-transparent border-b ${formState.name.length > 2 ? 'border-green-500/50' : 'border-[#333] focus:border-[#C9A96E]'} py-3 px-1 text-sm outline-none transition-colors`}
                      placeholder="Ej. María Pérez"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-widest mb-2">Correo Electrónico</label>
                    <input 
                      type="email" 
                      id="email"
                      value={formState.email}
                      onChange={e => setFormState({...formState, email: e.target.value})}
                      className={`w-full bg-transparent border-b ${formState.email.includes('@') ? 'border-green-500/50' : 'border-[#333] focus:border-[#C9A96E]'} py-3 px-1 text-sm outline-none transition-colors`}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-xs font-medium text-[#A0A0A0] uppercase tracking-widest mb-2">Mensaje</label>
                    <textarea 
                      id="message"
                      rows={3}
                      value={formState.message}
                      onChange={e => setFormState({...formState, message: e.target.value})}
                      className={`w-full bg-transparent border-b ${formState.message.length > 5 ? 'border-green-500/50' : 'border-[#333] focus:border-[#C9A96E]'} py-3 px-1 text-sm outline-none transition-colors resize-none custom-scrollbar`}
                      placeholder="¿En qué podemos ayudarte?"
                      required
                    ></textarea>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={!isFormValid}
                    className="w-full btn-gold py-4 rounded-sm font-medium tracking-wide text-sm mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ENVIAR MENSAJE
                  </button>
                </form>
              )}
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
                <a href="#" className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center hover:bg-[#C9A96E] hover:text-[#1A1A1A] hover:border-[#C9A96E] transition-all">
                  <Instagram size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center hover:bg-[#C9A96E] hover:text-[#1A1A1A] hover:border-[#C9A96E] transition-all">
                  <Youtube size={18} />
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
                <li className="flex items-center gap-2"><Phone size={14} className="text-[#C9A96E]" /> +57 300 123 4567</li>
                <li className="flex items-center gap-2"><MessageCircle size={14} className="text-[#C9A96E]" /> WhatsApp Disponible</li>
                <li className="flex items-center gap-2"><Mail size={14} className="text-[#C9A96E]" /> fraganti.col@gmail.com</li>
                <li className="mt-4 text-[#F8F5F2]">Medellín • Caucasia</li>
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
            <p className="text-xs">© 2024 FRAGANTI. Todos los derechos reservados.</p>
            
            <div className="flex gap-4 md:gap-6 text-[10px] md:text-xs font-medium uppercase tracking-widest text-[#F8F5F2]">
              <span className="flex items-center gap-1"><Check size={12} className="text-[#C9A96E]" /> 100% Autenticidad</span>
              <span className="flex items-center gap-1"><Check size={12} className="text-[#C9A96E]" /> Pago Seguro</span>
              <span className="flex items-center gap-1"><Check size={12} className="text-[#C9A96E]" /> Envíos a Colombia</span>
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
        <button className="w-full btn-gold py-3 rounded-sm font-medium text-sm shadow-[0_0_15px_rgba(201,169,110,0.3)]">
          VER CATÁLOGO COMPLETO
        </button>
      </div>

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/573001234567" 
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
        href="tel:+573001234567"
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

    </div>
  );
}
