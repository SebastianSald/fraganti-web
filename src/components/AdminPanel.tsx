import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Search, Plus, Trash2, LogOut, Check, X as XIcon, ChevronDown } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabaseClient";
import {
  loadPerfumes, actualizarPerfume, crearPerfume, eliminarPerfume, nuevoPerfumeVacio,
  FAMILIAS_CATALOGO, GENEROS_CATALOGO, FORMATO_LABELS, FORMATO_ORDEN,
  type Perfume, type FormatoKey,
} from "../data/perfumes";

import { loadCupones, crearCupon, actualizarCupon, eliminarCupon, type Cupon, type TipoCupon } from "../data/cupones";

// ============================================================================
// Panel de administración — /admin
// Reemplaza al antiguo public/admin/editor.html: ahora requiere iniciar
// sesión y guarda directo en Supabase (stock en vivo, sin pasar por GitHub).
// ============================================================================

function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      // Mostramos el mensaje real de Supabase (traducido cuando aplica) para
      // saber exactamente qué está pasando, en vez de adivinar.
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError("Tu usuario existe pero no está confirmado. Ve a Supabase → Authentication → Users, ábrelo y confírmalo (o bórralo y créalo de nuevo marcando \"Auto Confirm User\").");
      } else if (error.message.toLowerCase().includes("invalid login credentials")) {
        setError("Correo o contraseña incorrectos, o el usuario no existe en Supabase → Authentication → Users.");
      } else {
        setError(`Error de Supabase: ${error.message}`);
      }
      return;
    }
    onLoggedIn();
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6 font-sans">
      <form onSubmit={handleSubmit} className="bg-[#F8F5F2] rounded-lg p-10 w-full max-w-sm shadow-2xl">
        <h1 className="font-serif text-3xl text-center text-[#1A1A1A] tracking-wide mb-1">FRAGANTI</h1>
        <p className="text-center text-[#5A5A5A] text-sm mb-8">Panel de administración</p>

        <label className="block text-xs font-semibold uppercase tracking-wide text-[#B89250] mb-1">Correo</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded border border-[#E0E0E0] bg-white mb-4 text-sm outline-none focus:border-[#C9A96E]"
          placeholder="tucorreo@ejemplo.com"
        />

        <label className="block text-xs font-semibold uppercase tracking-wide text-[#B89250] mb-1">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded border border-[#E0E0E0] bg-white mb-6 text-sm outline-none focus:border-[#C9A96E]"
          placeholder="••••••••"
        />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded font-medium tracking-wide text-sm text-[#1A1A1A]"
          style={{ background: "linear-gradient(135deg, #D4AF37 0%, #C9A96E 100%)" }}
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}

function ChipList({
  label, values, onAdd, onRemove,
}: {
  label: string; values: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  };
  return (
    <div className="mb-3">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#B89250] mb-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.length === 0 && <span className="text-xs text-[#C9C4B8]">Sin notas todavía</span>}
        {values.map((v, i) => (
          <span key={i} className="flex items-center gap-1.5 bg-[#FDFBF7] border border-[#E5E0D5] rounded-full pl-3 pr-1.5 py-1 text-xs">
            {v}
            <button type="button" onClick={() => onRemove(i)} className="text-[#A0A0A0] hover:text-red-600">
              <XIcon size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Escribe una nota y presiona Enter"
          className="flex-1 px-3 py-2 border border-[#E0E0E0] rounded text-xs"
        />
        <button type="button" onClick={add} className="bg-[#1A1A1A] text-white px-3 py-2 rounded text-xs">Agregar</button>
      </div>
    </div>
  );
}

function FormatRow({
  formatKey, info, onChange,
}: {
  formatKey: FormatoKey;
  info: { disponible: boolean; precio: string; stock: number };
  onChange: (next: { disponible: boolean; precio: string; stock: number }) => void;
}) {
  return (
    <div className={`grid grid-cols-[1.4fr_1fr_0.7fr] gap-3 items-center p-3 rounded border border-[#E5E0D5] mb-2 ${!info.disponible ? "opacity-60" : ""}`} style={{ background: "#FDFBF7" }}>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={info.disponible}
          onChange={(e) => onChange({ ...info, disponible: e.target.checked })}
        />
        {FORMATO_LABELS[formatKey]}
      </label>
      <div>
        <span className="block text-[10px] text-[#A0A0A0]">Precio</span>
        <input
          type="text"
          disabled={!info.disponible}
          value={info.precio}
          onChange={(e) => onChange({ ...info, precio: e.target.value })}
          placeholder="Ej. $195.000"
          className="w-full px-2 py-1.5 border border-[#E0E0E0] rounded text-xs bg-white disabled:bg-[#F0EEE9] disabled:text-[#B0B0B0]"
        />
      </div>
      <div>
        <span className="block text-[10px] text-[#A0A0A0]">Stock</span>
        <input
          type="number"
          min={0}
          disabled={!info.disponible}
          value={info.stock}
          onChange={(e) => onChange({ ...info, stock: Number(e.target.value || 0) })}
          className="w-full px-2 py-1.5 border border-[#E0E0E0] rounded text-xs bg-white disabled:bg-[#F0EEE9] disabled:text-[#B0B0B0]"
        />
      </div>
    </div>
  );
}

function PerfumeCard({
  perfume, isOpen, onToggle, onSaved, onDeleted,
}: {
  perfume: Perfume;
  isOpen: boolean;
  onToggle: () => void;
  onSaved: (p: Perfume) => void;
  onDeleted: (id: number) => void;
}) {
  const [draft, setDraft] = useState<Perfume>(perfume);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setDraft(perfume); }, [perfume]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(perfume);
  const agotado = FORMATO_ORDEN.filter(k => draft.formatos[k].disponible)
    .every(k => draft.formatos[k].stock <= 0) || FORMATO_ORDEN.every(k => !draft.formatos[k].disponible);

  const guardar = async () => {
    setSaving(true);
    setError(null);
    try {
      await actualizarPerfume(draft.id, draft);
      onSaved(draft);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const borrar = async () => {
    if (!confirm(`¿Eliminar "${draft.name || "este perfume"}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarPerfume(draft.id);
      onDeleted(draft.id);
    } catch (e: any) {
      setError(e.message || "Error al eliminar");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#E5E0D5] mb-4 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#FDFBF7] transition-colors"
      >
        <img
          src={`/images/${draft.image}`}
          onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
          className="w-11 h-11 rounded object-cover bg-[#F5F5DC] flex-shrink-0"
        />
        <span className="font-serif text-xl">{draft.name || "(Sin nombre)"}</span>
        {agotado && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold">AGOTADO</span>}
        <span className="ml-auto text-xs uppercase tracking-wide text-[#B89250]">{draft.family} · {draft.genero}</span>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="px-5 pb-6 border-t border-[#F0EEE9] pt-5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#B89250] mb-1">Nombre</label>
              <input className="w-full px-3 py-2 border border-[#E0E0E0] rounded text-sm" value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#B89250] mb-1">Inspirado en (opcional)</label>
              <input className="w-full px-3 py-2 border border-[#E0E0E0] rounded text-sm" value={draft.inspiradoEn || ""}
                onChange={(e) => setDraft({ ...draft, inspiradoEn: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#B89250] mb-1">Familia olfativa</label>
              <select className="w-full px-3 py-2 border border-[#E0E0E0] rounded text-sm bg-white" value={draft.family}
                onChange={(e) => setDraft({ ...draft, family: e.target.value })}>
                {FAMILIAS_CATALOGO.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#B89250] mb-1">Género</label>
              <select className="w-full px-3 py-2 border border-[#E0E0E0] rounded text-sm bg-white" value={draft.genero}
                onChange={(e) => setDraft({ ...draft, genero: e.target.value as Perfume["genero"] })}>
                {GENEROS_CATALOGO.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#B89250] mb-1">Frase corta (se ve en la tarjeta)</label>
              <input className="w-full px-3 py-2 border border-[#E0E0E0] rounded text-sm" value={draft.notasCorta}
                onChange={(e) => setDraft({ ...draft, notasCorta: e.target.value })} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={!!draft.isNew} onChange={(e) => setDraft({ ...draft, isNew: e.target.checked })} />
            Mostrar etiqueta "NUEVO"
          </label>

          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#B89250] mb-1">
              Nombre del archivo de foto (debe existir en public/images/ en GitHub)
            </label>
            <input className="w-full px-3 py-2 border border-[#E0E0E0] rounded text-sm" value={draft.image}
              onChange={(e) => setDraft({ ...draft, image: e.target.value })} placeholder="nombre-archivo.jpg" />
          </div>

          <div className="mb-5 pt-4 border-t border-dashed border-[#E5E0D5]">
            <h4 className="font-serif text-lg mb-1">Disponibilidad, precio y stock</h4>
            <p className="text-xs text-[#A0A0A0] mb-3">Marca solo los formatos que sí vendes. Baja el stock a 0 cuando se agote — la tienda lo muestra "Agotado" sola.</p>
            {FORMATO_ORDEN.map((key) => (
              <FormatRow
                key={key}
                formatKey={key}
                info={draft.formatos[key]}
                onChange={(next) => setDraft({ ...draft, formatos: { ...draft.formatos, [key]: next } })}
              />
            ))}
          </div>

          <div className="mb-5 pt-4 border-t border-dashed border-[#E5E0D5]">
            <h4 className="font-serif text-lg mb-3">Pirámide Olfativa</h4>
            <ChipList label="Notas de Salida" values={draft.notas.salida}
              onAdd={(v) => setDraft({ ...draft, notas: { ...draft.notas, salida: [...draft.notas.salida, v] } })}
              onRemove={(i) => setDraft({ ...draft, notas: { ...draft.notas, salida: draft.notas.salida.filter((_, idx) => idx !== i) } })} />
            <ChipList label="Notas de Corazón" values={draft.notas.corazon}
              onAdd={(v) => setDraft({ ...draft, notas: { ...draft.notas, corazon: [...draft.notas.corazon, v] } })}
              onRemove={(i) => setDraft({ ...draft, notas: { ...draft.notas, corazon: draft.notas.corazon.filter((_, idx) => idx !== i) } })} />
            <ChipList label="Notas de Fondo" values={draft.notas.fondo}
              onAdd={(v) => setDraft({ ...draft, notas: { ...draft.notas, fondo: [...draft.notas.fondo, v] } })}
              onRemove={(i) => setDraft({ ...draft, notas: { ...draft.notas, fondo: draft.notas.fondo.filter((_, idx) => idx !== i) } })} />
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <div className="flex items-center justify-between">
            <button type="button" onClick={borrar} className="flex items-center gap-1.5 text-red-600 border border-red-600 rounded px-3 py-2 text-xs hover:bg-red-600 hover:text-white transition-colors">
              <Trash2 size={13} /> Eliminar perfume
            </button>
            <div className="flex items-center gap-3">
              {savedFlash && <span className="text-green-700 text-xs flex items-center gap-1"><Check size={14} /> Guardado</span>}
              <button
                type="button"
                onClick={guardar}
                disabled={!dirty || saving}
                className="px-6 py-2.5 rounded text-sm font-medium text-[#1A1A1A] disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #D4AF37 0%, #C9A96E 100%)" }}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CuponForm({ onCreated }: { onCreated: (c: Cupon) => void }) {
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<TipoCupon>("porcentaje");
  const [valor, setValor] = useState<number>(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const nuevo = await crearCupon({ codigo, tipo, valor, activo: true });
      onCreated(nuevo);
      setCodigo("");
      setValor(10);
    } catch (e: any) {
      setError(e.message.includes("duplicate") ? "Ya existe un cupón con ese código." : e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={crear} className="bg-white rounded-lg border border-[#E5E0D5] p-5 mb-6">
      <h3 className="font-serif text-lg mb-3">Crear nuevo cupón</h3>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="col-span-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#B89250] mb-1">Código</label>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="VERANO10"
            className="w-full px-3 py-2 border border-[#E0E0E0] rounded text-sm uppercase"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#B89250] mb-1">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoCupon)} className="w-full px-3 py-2 border border-[#E0E0E0] rounded text-sm bg-white">
            <option value="porcentaje">% Porcentaje</option>
            <option value="fijo">$ Monto fijo</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#B89250] mb-1">
            Valor {tipo === "porcentaje" ? "(%)" : "($ COP)"}
          </label>
          <input
            type="number"
            min={0}
            value={valor}
            onChange={(e) => setValor(Number(e.target.value || 0))}
            className="w-full px-3 py-2 border border-[#E0E0E0] rounded text-sm"
          />
        </div>
      </div>
      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}
      <button
        type="submit"
        disabled={saving || !codigo.trim()}
        className="px-5 py-2 rounded text-sm font-medium text-[#1A1A1A] disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #D4AF37 0%, #C9A96E 100%)" }}
      >
        {saving ? "Creando..." : "Crear cupón"}
      </button>
    </form>
  );
}

function CuponesPanel() {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCupones().then(setCupones).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const toggleActivo = async (c: Cupon) => {
    try {
      await actualizarCupon(c.id, { activo: !c.activo });
      setCupones((prev) => prev.map((x) => (x.id === c.id ? { ...x, activo: !x.activo } : x)));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const borrar = async (id: number) => {
    if (!confirm("¿Eliminar este cupón?")) return;
    try {
      await eliminarCupon(id);
      setCupones((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      <CuponForm onCreated={(c) => setCupones((prev) => [...prev, c])} />

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading && <p className="text-[#5A5A5A] text-sm">Cargando cupones...</p>}

      {!loading && cupones.length === 0 && (
        <p className="text-center text-[#A0A0A0] py-10 text-sm">Todavía no has creado ningún cupón.</p>
      )}

      <div className="space-y-3">
        {cupones.map((c) => (
          <div key={c.id} className="bg-white rounded-lg border border-[#E5E0D5] p-4 flex items-center justify-between">
            <div>
              <p className="font-mono font-semibold text-[#1A1A1A]">{c.codigo}</p>
              <p className="text-xs text-[#5A5A5A]">
                {c.tipo === "porcentaje" ? `${c.valor}% de descuento` : `${c.valor.toLocaleString("es-CO")} COP de descuento`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                <input type="checkbox" checked={c.activo} onChange={() => toggleActivo(c)} />
                {c.activo ? "Activo" : "Inactivo"}
              </label>
              <button onClick={() => borrar(c.id)} className="text-[#C9C4B8] hover:text-red-600 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"perfumes" | "cupones">("perfumes");
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const cargar = () => {
    setLoading(true);
    loadPerfumes()
      .then(setPerfumes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, []);

  const visibles = perfumes.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const agregar = async () => {
    try {
      const nuevo = await crearPerfume(nuevoPerfumeVacio());
      setPerfumes(prev => [...prev, nuevo]);
      setSearch("");
      setOpenId(nuevo.id);
      setTimeout(() => {
        document.getElementById(`card-${nuevo.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5F2] font-sans pb-24">
      <header className="bg-[#1A1A1A] text-white px-6 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-serif text-2xl tracking-wide text-[#C9A96E]">FRAGANTI</h1>
            <p className="text-xs text-[#A0A0A0]">Panel de administración — {perfumes.length} perfumes</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-sm border border-[#333] rounded px-4 py-2 hover:bg-[#333] transition-colors">
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("perfumes")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-colors ${tab === "perfumes" ? "bg-[#C9A96E] text-[#1A1A1A]" : "text-[#A0A0A0] hover:text-white"}`}
          >
            Perfumes
          </button>
          <button
            onClick={() => setTab("cupones")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-colors ${tab === "cupones" ? "bg-[#C9A96E] text-[#1A1A1A]" : "text-[#A0A0A0] hover:text-white"}`}
          >
            Cupones
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pt-8">
        {tab === "cupones" ? (
          <CuponesPanel />
        ) : (
          <>
            <div className="relative mb-6">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar perfume por nombre..."
                className="w-full pl-9 pr-4 py-3 rounded border border-[#E0E0E0] bg-white text-sm outline-none focus:border-[#C9A96E]"
              />
            </div>

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            {loading && <p className="text-[#5A5A5A] text-sm">Cargando catálogo...</p>}

            {!loading && visibles.length === 0 && (
              <p className="text-center text-[#A0A0A0] py-10 text-sm">
                {search ? `Ningún perfume coincide con "${search}".` : "Todavía no hay perfumes."}
              </p>
            )}

            {visibles.map((p) => (
              <div id={`card-${p.id}`} key={p.id}>
                <PerfumeCard
                  perfume={p}
                  isOpen={openId === p.id}
                  onToggle={() => setOpenId(openId === p.id ? null : p.id)}
                  onSaved={(updated) => setPerfumes(prev => prev.map(x => x.id === updated.id ? updated : x))}
                  onDeleted={(id) => setPerfumes(prev => prev.filter(x => x.id !== id))}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={agregar}
              className="w-full py-4 rounded-lg border-2 border-dashed border-[#d1cec7] text-[#5A5A5A] hover:border-[#C9A96E] hover:text-[#1A1A1A] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Plus size={16} /> Agregar nuevo perfume
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function AdminPanel() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6">
        <div className="bg-[#F8F5F2] rounded-lg p-8 max-w-md text-center">
          <h1 className="font-serif text-2xl mb-3">Supabase no está configurado todavía</h1>
          <p className="text-sm text-[#5A5A5A] mb-2">
            Faltan las variables <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en Vercel.
          </p>
          <p className="text-sm text-[#5A5A5A]">Sigue los pasos del README (sección "Configurar Supabase") y vuelve a intentar.</p>
        </div>
      </div>
    );
  }

  if (session === undefined) {
    return <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-[#C9A96E] font-serif text-xl">Cargando...</div>;
  }

  if (!session) {
    return <LoginScreen onLoggedIn={() => { /* onAuthStateChange actualiza la sesión solo */ }} />;
  }

  return <Dashboard onLogout={() => supabase!.auth.signOut()} />;
}
