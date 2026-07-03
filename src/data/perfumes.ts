// ============================================================================
// CATÁLOGO DE PERFUMES — edita este archivo para actualizar tu tienda.
//
// Cada perfume tiene:
//   - id, name, family, price, image, isNew   → igual que antes
//   - notas: { salida, corazon, fondo }        → pirámide olfativa (estilo
//     Fragrantica) que se muestra en el modal "VISTA RÁPIDA"
//
// Para las fotos: coloca el archivo en /public/images/ y escribe aquí solo
// el nombre del archivo (ej: "mi-foto.jpg"). No hace falta tocar el código
// del sitio, solo este archivo.
// ============================================================================

export interface FragranceNotes {
  salida: string[];
  corazon: string[];
  fondo: string[];
}

export interface Perfume {
  id: number;
  name: string;
  /** Nombre de la casa/marca original en la que se basa (opcional, solo informativo) */
  inspiradoEn?: string;
  family: string;
  price: string;
  image: string;
  isNew?: boolean;
  /** Frase corta que aparece debajo del nombre en la tarjeta */
  notasCorta: string;
  /** Pirámide olfativa completa, se muestra en la Vista Rápida */
  notas: FragranceNotes;
}

export const PRODUCTS: Perfume[] = [
  {
    id: 1,
    name: "Oud Noir",
    family: "Oriental",
    price: "$85.000",
    image: "fraganti-prod1.jpg",
    isNew: true,
    notasCorta: "ámbar, oud, sándalo",
    // TODO: reemplaza estas notas por las de la casa/perfume real que estés
    // vendiendo bajo este nombre (ej. "Oud Noir de XYZ" o su equivalente).
    notas: {
      salida: ["Ámbar", "Bergamota", "Pimienta rosa"],
      corazon: ["Oud", "Rosa", "Azafrán"],
      fondo: ["Sándalo", "Almizcle", "Vainilla"],
    },
  },
  {
    id: 2,
    name: "Fleur de Jasmin",
    family: "Floral",
    price: "$72.000",
    image: "fraganti-prod2.jpg",
    notasCorta: "jazmín, rosa, almizcle",
    // TODO: reemplaza por las notas reales del perfume/casa que corresponda.
    notas: {
      salida: ["Bergamota", "Pera"],
      corazon: ["Jazmín", "Rosa", "Flor de azahar"],
      fondo: ["Almizcle blanco", "Sándalo", "Vainilla"],
    },
  },
  {
    id: 3,
    name: "Aventus Club",
    inspiradoEn: "Creed Aventus",
    family: "Fresca",
    price: "$95.000",
    image: "fraganti-prod3.jpg",
    notasCorta: "manzana, bergamota, cedro",
    notas: {
      salida: ["Bergamota", "Grosellas negras", "Manzana", "Limón", "Pimienta rosa"],
      corazon: ["Piña", "Pachulí", "Jazmín de Marruecos"],
      fondo: ["Abedul", "Almizcle", "Musgo de roble", "Cedro", "Ambroxan"],
    },
  },
  {
    id: 4,
    name: "La Vie Est Belle",
    inspiradoEn: "Lancôme La Vie Est Belle",
    family: "Floral Oriental",
    price: "$78.000",
    image: "fraganti-prod2.jpg",
    notasCorta: "iris, pralinée, vainilla",
    notas: {
      salida: ["Grosellas negras", "Pera"],
      corazon: ["Iris", "Jazmín", "Flor de azahar del naranjo"],
      fondo: ["Praliné", "Vainilla", "Pachulí", "Haba tonka"],
    },
  },
  {
    id: 5,
    name: "Terre d'Hermès",
    inspiradoEn: "Hermès Terre d'Hermès",
    family: "Amaderada",
    price: "$110.000",
    image: "fraganti-prod3.jpg",
    isNew: true,
    notasCorta: "pomelo, pimienta, vetiver",
    notas: {
      salida: ["Naranja", "Toronja (pomelo)"],
      corazon: ["Pimienta", "Pelargonio", "Sílex"],
      fondo: ["Vetiver", "Cedro", "Pachulí", "Benjuí"],
    },
  },
  {
    id: 6,
    name: "Black Orchid",
    inspiradoEn: "Tom Ford Black Orchid",
    family: "Oriental",
    price: "$92.000",
    image: "fraganti-prod1.jpg",
    notasCorta: "orquídea, vainilla, pachulí",
    notas: {
      salida: ["Trufa", "Gardenia", "Grosellas negras", "Ylang-ylang", "Jazmín", "Bergamota"],
      corazon: ["Orquídea", "Especias", "Flor de loto"],
      fondo: ["Chocolate mexicano", "Pachulí", "Vainilla", "Incienso", "Ámbar", "Sándalo"],
    },
  },
];

export interface OlfactoryFamily {
  name: string;
  notes: string;
}

export const FAMILIES: OlfactoryFamily[] = [
  { name: "Floral", notes: "Rosa, Jazmín, Peonía" },
  { name: "Amaderado", notes: "Cedro, Sándalo, Vetiver" },
  { name: "Cítrico", notes: "Bergamota, Pomelo, Limón" },
  { name: "Oriental", notes: "Oud, Ámbar, Incienso" },
];

export const QUIZ_QUESTIONS = [
  {
    question: "¿Cómo describes tu estilo?",
    options: ["Elegante", "Casual", "Atrevido", "Romántico"],
  },
  {
    question: "¿Qué momento describe tu uso ideal?",
    options: ["Cita romántica", "Reunión de trabajo", "Fiesta", "Día casual"],
  },
  {
    question: "¿Qué sensación buscas transmitir?",
    options: ["Fresco y limpio", "Cálido y sensual", "Misterioso", "Energizante"],
  },
  {
    question: "¿Qué nota olfativa prefieres?",
    options: ["Floral", "Oriental", "Cítrico", "Amaderado"],
  },
];
