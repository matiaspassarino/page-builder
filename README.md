# Page Builder

Prototipo local de un page builder visual hecho con [Puck](https://puckeditor.com) (`@puckeditor/core`) sobre Next.js (App Router). El alcance y las decisiones están en [sdd.md](sdd.md).

## Requisitos

- Node 24 LTS (fijado en `.node-version`; con `fnm --use-on-cd` se activa solo al entrar a la carpeta).

## Uso

```sh
npm install
npm run dev
```

- `/` — listado de páginas.
- `/<slug>` — página pública.
- `/<slug>/edit` — editor. `proxy.ts` reescribe internamente esta URL a `/puck/<slug>`.

## Componentes

- **Contenedor**: slot anidable con layout block/flex/grid, gap, padding, fondo, ancho máximo y alineación.
- **Texto**: p/h1/h2/h3, tamaño, color y alineación.
- **Imagen**: URL, texto alternativo, ancho (%) y radio del borde.
- **Botón**: link, variante primario/secundario y colores.
- **Página (root)**: título y color de fondo.

Todos los campos de color usan el campo custom `puck/fields/ColorField.tsx`.

## Estructura

- `puck/` — config de Puck, componentes y campos custom.
- `lib/pages-repo.ts` — interfaz `PagesRepo` y su implementación sobre archivo. Toda lectura y escritura de páginas pasa por acá.
- `app/actions.ts` — server actions para crear, guardar y borrar páginas.
- `data/pages.json` — páginas guardadas (no se versiona; se crea con la primera página).

## Scripts

- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción.
- `npm run lint` — ESLint (config de Next).
