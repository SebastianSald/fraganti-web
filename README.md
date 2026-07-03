# FRAGANTI — Perfumes Originales y Decants en Colombia

Sitio reconstruido como proyecto **Vite + React + TypeScript** estándar,
100% compatible con Vercel (sin las dependencias de Replit del proyecto
original: sin `PORT`/`BASE_PATH` obligatorios, sin monorepo pnpm, sin
plugins de preview).

## Cómo editar el contenido

**Todo el catálogo vive en un solo archivo:** `src/data/perfumes.ts`

Ahí puedes cambiar, sin tocar nada más:
- Nombre, precio, familia olfativa de cada perfume
- La foto (coloca el archivo en `public/images/` y escribe el nombre aquí)
- Si tiene la etiqueta "NUEVO"
- Las notas de salida / corazón / fondo (pirámide olfativa que se ve al
  hacer clic en "VISTA RÁPIDA" en cada tarjeta)

Dos perfumes (`Oud Noir` y `Fleur de Jasmin`) tienen nombres genéricos sin
marca asociada — están marcados con `// TODO` en el archivo para que pongas
las notas reales de la fragancia/casa que efectivamente estés vendiendo bajo
ese nombre.

Las imágenes actuales (`fraganti-*.jpg`) son placeholders genéricos —
reemplázalas en `public/images/` por fotos reales de producto cuando las
tengas, usando el mismo nombre de archivo o actualizando la referencia en
`perfumes.ts`.

## Correr en local

```bash
npm install
npm run dev
```

## Desplegar en Vercel vía GitHub

1. Sube esta carpeta completa a un repositorio de GitHub (puede ser nuevo,
   no hace falta que sea el mismo repo de Replit).
2. En Vercel: **Add New Project** → importa el repositorio.
3. Vercel detecta automáticamente que es un proyecto Vite (el archivo
   `vercel.json` incluido lo deja explícito de todas formas):
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy. No se requiere ninguna variable de entorno.

## Estructura

```
src/
  data/perfumes.ts       ← EDITA AQUÍ el catálogo y las notas
  components/
    Landing.tsx           ← la página completa (idéntica visualmente al original)
    QuickViewModal.tsx     ← modal de pirámide olfativa (nuevo)
  App.tsx
  main.tsx
  index.css
public/
  images/                 ← fotos de perfumes y secciones
```
