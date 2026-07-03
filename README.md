# FRAGANTI — Perfumes Originales y Decants en Colombia

Sitio reconstruido como proyecto **Vite + React + TypeScript** estándar,
100% compatible con Vercel (sin las dependencias de Replit del proyecto
original: sin `PORT`/`BASE_PATH` obligatorios, sin monorepo pnpm, sin
plugins de preview).

## ✏️ Cómo editar el catálogo — SIN TOCAR CÓDIGO

Hay un **editor visual** pensado para que cualquiera en el equipo pueda
actualizar perfumes sin abrir una línea de código.

### Opción A — Editor visual (recomendado)

1. Abre el archivo `public/admin/editor.html` haciendo **doble clic** (se abre
   en tu navegador, no necesita internet ni instalar nada). También puedes
   visitarlo en `tu-sitio.vercel.app/admin/editor.html` una vez desplegado.
2. Dale clic a **"Cargar perfumes.json existente"** y selecciona el archivo
   que está en `public/data/perfumes.json` — así ves todos tus perfumes
   actuales listos para editar.
3. Cambia lo que necesites con los formularios: nombre, precio, familia,
   fotos, notas de salida/corazón/fondo (con botón "Agregar" para cada nota).
4. Dale clic a **"Descargar catálogo actualizado"** — se descarga un nuevo
   `perfumes.json`.
5. Sube ese archivo a GitHub (sin usar la terminal):
   - Entra a tu repositorio en github.com
   - Abre la carpeta `public/data/`
   - Haz clic en `perfumes.json` → ícono de lápiz (editar) → borra todo y
     pega el contenido del archivo descargado → o simplemente arrastra el
     archivo nuevo sobre la carpeta para reemplazarlo
   - Dale a "Commit changes"
6. Si agregaste **fotos nuevas**: en GitHub entra a `public/images/` → botón
   "Add file" → "Upload files" → arrastra las fotos (deben llamarse igual a
   como las escribiste en el editor) → "Commit changes".
7. Vercel detecta el cambio automáticamente y actualiza tu página en menos
   de un minuto. No necesitas hacer nada más.

### Opción B — Editar el JSON a mano

Si prefieres, `public/data/perfumes.json` es un archivo de texto simple que
también puedes editar directamente en GitHub (botón de lápiz) sin el editor
visual. La estructura de cada perfume es:

```json
{
  "id": 1,
  "name": "Oud Noir",
  "inspiradoEn": "",
  "family": "Oriental",
  "price": "$85.000",
  "image": "fraganti-prod1.jpg",
  "isNew": true,
  "notasCorta": "ámbar, oud, sándalo",
  "notas": {
    "salida": ["Ámbar", "Bergamota", "Pimienta rosa"],
    "corazon": ["Oud", "Rosa", "Azafrán"],
    "fondo": ["Sándalo", "Almizcle", "Vainilla"]
  }
}
```

## Correr en local

```bash
npm install
npm run dev
```

## Desplegar en Vercel vía GitHub

1. Sube esta carpeta completa a un repositorio de GitHub.
2. En Vercel: **Add New Project** → importa el repositorio.
3. Vercel detecta automáticamente que es un proyecto Vite (el archivo
   `vercel.json` incluido lo deja explícito de todas formas):
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy. No se requiere ninguna variable de entorno.
5. A partir de ahí, cada vez que actualices `perfumes.json` (paso anterior)
   y hagas commit en GitHub, Vercel vuelve a desplegar solo.

## Estructura

```
public/
  admin/editor.html      ← EDITOR VISUAL — abre esto para cambiar el catálogo
  data/perfumes.json     ← el catálogo en sí (lo edita el editor visual)
  images/                ← fotos de perfumes y secciones
src/
  data/perfumes.ts        ← tipos + carga del JSON (no hace falta tocarlo)
  components/
    Landing.tsx            ← la página completa (idéntica visualmente al original)
    QuickViewModal.tsx      ← modal de pirámide olfativa
  App.tsx
  main.tsx
  index.css
```
