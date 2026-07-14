/**
 * Métodos de pago por transferencia/QR (Nequi, Daviplata, Bancolombia, etc.).
 *
 * ⚠️ IMPORTANTE: mientras esta lista esté vacía, la opción "Transferencia / QR"
 * simplemente NO aparece en el carrito (solo se ve "Coordinar por WhatsApp").
 * Esto es a propósito: es preferible que no se muestre nada a que se muestre
 * un dato de prueba o incorrecto por accidente.
 *
 * Para activarla, agrega uno o varios objetos aquí con tus datos REALES.
 * Ejemplo (déjalo comentado hasta que pongas tus datos de verdad):
 *
 * export const METODOS_PAGO: MetodoPago[] = [
 *   {
 *     id: "nequi",
 *     nombre: "Nequi",
 *     titular: "Sebastian Salazar",
 *     numero: "300 000 0000",
 *     nota: "Envía el pago exacto y guarda el comprobante.",
 *   },
 *   {
 *     id: "bancolombia",
 *     nombre: "Bancolombia",
 *     titular: "Sebastian Salazar",
 *     numero: "000-000000-00",
 *     tipoCuenta: "Ahorros",
 *     qrImagen: "qr-bancolombia.png", // debe existir en public/images/
 *   },
 * ];
 */

export interface MetodoPago {
  /** Identificador único, ej. "nequi", "bancolombia". */
  id: string;
  /** Nombre a mostrar, ej. "Nequi", "Bancolombia", "Daviplata". */
  nombre: string;
  /** Nombre completo del titular de la cuenta — genera confianza al cliente. */
  titular: string;
  /** Número de cuenta o de celular (Nequi/Daviplata) al que se transfiere. */
  numero: string;
  /** Solo para cuentas bancarias: "Ahorros" o "Corriente". */
  tipoCuenta?: string;
  /** Nombre del archivo del QR (debe existir en public/images/) o un link completo. */
  qrImagen?: string;
  /** Nota corta opcional, ej. instrucciones específicas de esa cuenta. */
  nota?: string;
}

export const METODOS_PAGO: MetodoPago[] = [
  {
    id: "nequi",
    nombre: "Nequi",
    titular: "Juan Saldarriaga",
    numero: "310 395 4280",
    // qrImagen: "qr-nequi.png", // sube la imagen a public/images/ y descomenta esta línea con el nombre exacto del archivo
    nota: "Envía el valor exacto del pedido y guarda el comprobante.",
  },
  {
    id: "breb",
    nombre: "Llave Bre-B",
    titular: "Juan Saldarriaga",
    numero: "0093130967",
    qrImagen: "QR.jpg", // sube la imagen a public/images/ y descomenta esta línea con el nombre exacto del archivo
    nota: "Bre-B es el nuevo sistema de pagos inmediatos entre bancos y billeteras — puedes usar esta llave desde cualquier entidad compatible.",
  },
];
