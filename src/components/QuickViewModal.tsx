import { X } from "lucide-react";
import type { Perfume } from "../data/perfumes";

interface QuickViewModalProps {
  product: Perfume | null;
  onClose: () => void;
}

function NoteRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mb-5 last:mb-0">
      <span className="text-[#C9A96E] text-xs font-semibold tracking-widest uppercase mb-2 block">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span
            key={v}
            className="text-xs md:text-sm px-3 py-1.5 rounded-full border border-[#E5E0D5] bg-[#FDFBF7] text-[#333]"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1A1A1A]/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-[#F8F5F2] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#1A1A1A]/80 text-[#F8F5F2] flex items-center justify-center hover:bg-[#C9A96E] hover:text-[#1A1A1A] transition-colors"
        >
          <X size={18} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative h-64 md:h-full bg-[#F5F5DC]/30 flex items-center justify-center p-8 md:p-10">
            {product.isNew && (
              <span className="absolute top-6 left-6 z-10 bg-[#C9A96E] text-[#1A1A1A] text-[10px] font-bold px-3 py-1 tracking-widest rounded-sm">
                NUEVO
              </span>
            )}
            <img
              src={`/images/${product.image}`}
              alt={product.name}
              className="w-full h-full object-cover mix-blend-multiply rounded-md"
            />
          </div>

          {/* Details */}
          <div className="p-8 md:p-10 flex flex-col">
            <span className="text-[#C9A96E] text-xs font-semibold tracking-widest uppercase mb-2">
              {product.family}
            </span>
            <h3 className="font-serif text-3xl text-[#1A1A1A] mb-1">{product.name}</h3>
            {product.inspiradoEn && (
              <p className="text-[#A0A0A0] text-xs italic font-serif mb-4">
                Inspirado en {product.inspiradoEn}
              </p>
            )}
            <p className="text-[#1A1A1A] font-medium tracking-wide mb-6">{product.price}</p>

            <div className="border-t border-[#E5E0D5] pt-6 mb-6">
              <h4 className="font-serif text-lg text-[#1A1A1A] mb-4">Pirámide Olfativa</h4>
              <NoteRow label="Notas de Salida" values={product.notas.salida} />
              <NoteRow label="Notas de Corazón" values={product.notas.corazon} />
              <NoteRow label="Notas de Fondo" values={product.notas.fondo} />
            </div>

            <button className="w-full btn-gold py-4 rounded-sm font-medium tracking-wide text-sm mt-auto">
              AGREGAR AL CARRITO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
