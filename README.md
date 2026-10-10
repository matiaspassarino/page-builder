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

## Scripts

- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción.
- `npm run lint` — ESLint (config de Next).
