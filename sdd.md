# Prompt para Claude Code — Page builder con Puck (MVP local)

Vamos a construir un prototipo local de un page builder visual (estilo Webflow/Elementor) usando **Puck** (`@puckeditor/core`) sobre **Next.js**. El entorno es **CachyOS** (basado en Arch: usa pacman con sus propios repos optimizados además de los de Arch, trae `paru` como helper del AUR y **fish** como shell por defecto). Abajo está el SDD. Antes de escribir código:

1. Leé el SDD completo.
2. Ejecutá la **Fase 0 (verificación del entorno)** y mostrame el reporte. No instales nada sin mi OK.
3. Verificá la API actual de Puck en https://puckeditor.com/docs (el paquete es `@puckeditor/core`, no `@measured/puck`; para anidar se usa el field `slot`, no `DropZone`).
4. Proponeme un plan por fases y esperá mi OK.

Trabajá de a una fase por vez. Al terminar cada fase: corré `npm run build` y `npm run lint`, decime qué probar en el navegador y esperá confirmación antes de seguir.

---

## SDD — Page Builder MVP

### 1. Objetivo
Validar en local el núcleo de un page builder: editar páginas visualmente con componentes configurables, guardarlas como JSON y renderizarlas como sitio público. No es producción: no hay auth, multi-tenant ni deploy.

### 2. Stack
- Next.js 16 (App Router) + TypeScript (`strict: true`), generado con `npx create-puck-app` (recipe `next`, sin Puck AI).
- `@puckeditor/core` 0.23 para editor (`<Puck>`) y render (`<Render>`).
- Node 24 LTS, fijado en `.node-version` y en `engines` (`>=24`). En local se gestiona con `fnm` (`--use-on-cd`).
- ESLint 9 con `eslint-config-next` (core-web-vitals + typescript).
- Estilos de componentes con inline styles / CSS variables. Sin Tailwind dentro de los componentes del builder.
- Persistencia local en archivo JSON, detrás de una capa de repositorio (ver §5).

### 3. Alcance (in scope)
- Editor en `/<slug>/edit` y página pública en `/<slug>` (esquema de la recipe, ver §6).
- Listado simple de páginas en `/` con links a ver/editar, botón "Borrar" (con confirmación) y formulario "Nueva página" (pide slug).
- Slugs: minúsculas, números y guiones; subpáginas separadas con `/` (`blog/post-1`). Reservados: `puck`, `api` y `_next` como primer segmento, y `edit` en cualquier segmento. El slug se fija al crear la página y no cambia al editar el título.
- Componentes:
  - **Contenedor**: `slot` de contenido + `display` (block/flex/grid), `direccion` (row/column), `columnas` (1–6, para grid), `gap`, `padding`, `fondo` (color), `maxWidth`, `alineacion` (justify/align). Debe poder anidarse.
  - **Texto**: `texto` (textarea), `tag` (p/h1/h2/h3), `tamano`, `color`, `alineacion`.
  - **Imagen**: `src`, `alt`, `ancho` (%), `radio` (border-radius).
  - **Boton**: `texto`, `href`, `variante` (primario/secundario), `colorFondo`, `colorTexto`.
- **Campo custom de color**: input `type="color"` + input de texto hex sincronizados, reutilizable en todos los campos de color.
- Root config: título de la página y color de fondo general.

### 4. Fuera de alcance
Auth, usuarios, multi-tenant, dominios, subida de imágenes (se usan URLs), responsive por breakpoint, undo/redo propio (usar el de Puck), Supabase, deploy, renombrar el slug de una página existente (pendiente, baja prioridad).

### 5. Modelo de datos y persistencia
- Una página = `{ slug: string, data: Data, updatedAt: string }`, donde `Data` es el tipo de Puck.
- Guardado en `data/pages.json` como un array de páginas (misma forma que filas de una tabla). Reemplaza al `database.json` de la recipe. El archivo no se versiona en git y se crea con la primera página.
- `slug` es la ruta sin `/` inicial (`contacto`, `blog/post-1`). El título de la página vive en `data.root.props.title`.
- **Toda lectura/escritura pasa por `lib/pages-repo.ts`** con esta interfaz:
  ```ts
  interface PagesRepo {
    list(): Promise<PageSummary[]>;
    get(slug: string): Promise<Page | null>;
    save(slug: string, data: Data): Promise<void>;
    remove(slug: string): Promise<void>;
  }
  ```
  La implementación inicial es `FilePagesRepo`. Objetivo: después reemplazarla por `SupabasePagesRepo` sin tocar UI ni rutas (se cambia solo la instancia exportada `pagesRepo`).
- `FilePagesRepo` escribe de forma atómica (archivo temporal + `rename`) y serializa las escrituras con una cola en memoria. Alcanza para un único proceso de servidor.
- Las escrituras pasan por server actions en `app/actions.ts`, que validan slug y datos antes de usar el repo:
  - `savePage(slug, data)`: la llama `onPublish` del editor.
  - `createPage(formData)`: la usa el formulario "Nueva página". Guarda una página vacía y redirige al editor.
  - `deletePage(slug)`: la usa el botón "Borrar".
- Caché: la página pública es `force-static` y se invalida con `revalidatePath` al guardar o borrar. El listado y el editor son dinámicos.

### 6. Estructura
```
proxy.ts                         # reescribe /<slug>/edit -> /puck/<slug>; bloquea /puck directo
app/
  page.tsx                       # listado de páginas
  actions.ts                     # server actions: savePage, createPage, deletePage
  _components/                   # formulario "Nueva página" y botón "Borrar"
  [...puckPath]/page.tsx         # render público (force-static)
  puck/[...puckPath]/page.tsx    # editor (force-dynamic)
puck/
  config.tsx                     # config raíz que junta todo (incluye root: título y fondo)
  components/                    # Contenedor, Texto, Imagen, Boton (fields + defaultProps + render)
  fields/ColorField.tsx          # campo custom de color
lib/
  pages-repo.ts                  # interfaz + FilePagesRepo
  slug.ts                        # validación y normalización de slugs
  page-data.ts                   # página vacía, título y chequeo de forma de Data
data/
  pages.json                     # no versionado
```

### 7. Criterios de aceptación
- Puedo crear una página nueva desde `/`, editarla, publicar y verla en su URL pública.
- Puedo anidar Contenedores (al menos 3 niveles) y cambiar a grid/flex viendo el cambio en vivo.
- Al recargar el editor, la página conserva lo publicado.
- El color picker funciona igual en todos los componentes.
- `npm run build` y `npm run lint` pasan sin errores. Tipos estrictos, sin `any` salvo justificado.

### 8. Fases

**Fase 0 — Verificación del entorno (CachyOS)**

Solo diagnóstico, sin instalar ni modificar nada del sistema.

Tené en cuenta el shell: chequeá cuál uso (`echo $SHELL`). Si es fish, los comandos con sintaxis bash (`;`, `2>/dev/null`, `$(...)`) pueden comportarse distinto: ejecutalos con `bash -c '...'` o adaptá la sintaxis. Cualquier configuración de shell que propongas (PATH, gestor de versiones) tiene que ser para el shell que efectivamente uso (en fish: `~/.config/fish/config.fish` o `fish_add_path`, no `.bashrc`).

1. Consultá en la documentación oficial las versiones mínimas actuales de Node.js que requieren Next.js y `@puckeditor/core` (revisar `engines` en el `package.json` publicado: `npm view @puckeditor/core engines` y `npm view next engines`). No asumas versiones de memoria.
2. Chequeá qué hay instalado:
   ```bash
   node -v; npm -v; npx -v; git --version
   which node                       # ¿viene de pacman, nvm, fnm o volta?
   pacman -Qi nodejs npm 2>/dev/null | grep -E 'Name|Version|Repository'   # ¿de qué repo vienen?
   pacman -Ss '^nodejs'             # versiones disponibles en los repos de CachyOS y Arch
   command -v nvm fnm volta pnpm 2>/dev/null
   npm config get prefix            # detectar si los globales van a /usr (requeriría sudo)
   ```
3. Chequeá conectividad al registry: `npm ping`.
4. Entregame un reporte en tabla: herramienta | versión instalada | versión requerida | estado (OK / falta / desactualizada).
5. Si falta algo o la versión no alcanza, proponé cómo resolverlo en Arch, priorizando en este orden:
   - Si ya uso un gestor de versiones (nvm/fnm/volta), usarlo para instalar la LTS requerida.
   - Si no, ofrecer dos opciones y que yo elija: el paquete LTS de pacman (`pacman -Ss nodejs-lts` para ver cuál corresponde) o `fnm` (está en los repos oficiales y funciona nativo en fish, a diferencia de `nvm`, que en fish necesita wrappers como `nvm.fish`).
   - Nunca usar `sudo npm install -g`. Si el prefix global apunta a `/usr`, proponer configurar un prefix en el home o usar `npx`.
   - No usar paquetes del AUR (ni `paru`/`yay`) sin consultarme; priorizar los repos oficiales.
   - No hacer `pacman -Sy` sin `-u` (actualización parcial): si hace falta actualizar, proponer `sudo pacman -Syu` completo.
   - Todo comando con `sudo` me lo mostrás y lo ejecuto yo.
6. Una vez resuelto, fijá la versión de Node del proyecto con un `.nvmrc` / `.node-version` y el campo `engines` en `package.json`.

Criterio de salida: `node -v` cumple el mínimo, `npm ping` responde y `npx create-puck-app --help` (o equivalente) corre sin errores.

**Fases de desarrollo**

1. Scaffold con la recipe + limpieza + estructura de carpetas.
2. Capa `pages-repo` y listado de páginas en `/`.
3. Componentes Contenedor y Texto (anidamiento funcionando).
4. Imagen, Boton y ColorField.
5. Root config y repaso de criterios de aceptación.

### 9. Notas
- Explicame brevemente las decisiones de backend (rutas API, server actions, manejo de archivos): estoy aprendiendo esa parte.
- Si algo del SDD choca con cómo funciona Puck hoy, avisame y proponé la alternativa antes de improvisar.

### 10. Desvíos respecto al SDD original
Cambios acordados durante la implementación, con su motivo:

- **Rutas del editor**: `app/[...slug]/edit/page.tsx` no es posible en Next (un catch-all tiene que ser el último segmento). Se usa el esquema de la recipe: `proxy.ts` reescribe `/<slug>/edit` a `app/puck/[...puckPath]`. La URL que ve el usuario es la misma.
- **Persistencia**: se reemplazó `database.json` + `lib/get-page.ts` + la ruta `/puck/api` de la recipe por `data/pages.json` detrás de `lib/pages-repo.ts`.
- **Endpoint de publicación**: server actions en lugar de la ruta de API de la recipe (llamadas tipadas, sin `fetch` manual).
- **`/` no es una página editable**: la recipe la renderizaba como página de Puck; ahora es el listado.
- **Botón "Borrar" en el listado**: agregado para usar `remove()` del repo.
- **Escritura atómica y cola de escrituras** en `FilePagesRepo` (la recipe escribía directo con `writeFileSync`).
- **Arreglos sobre el scaffold**: se quitó `app/favicon.ico` (la plantilla trae un ICO que Next 16.4 no decodifica y rompe el build); se reemplazó el tsconfig de la recipe, que desactivaba `strict`; se configuró ESLint, porque la recipe dependía de `eslint-config-custom`, un paquete interno del monorepo de Puck.
- **Botón**: el link se desactiva en el editor y solo acepta `http(s)`, `mailto:`, `tel:`, rutas internas y anclas (evita `javascript:`). `colorTexto` aplica a la variante primaria; la secundaria usa el color principal para borde y texto.
- **Imagen**: usa `<img>` y no `next/image`, porque las URLs son arbitrarias y `next/image` exige declarar cada dominio.

Limitaciones conocidas:
- Puck envuelve cada hijo de un slot en un `div`. En un Contenedor flex en fila, el ancho en % de una Imagen se calcula contra ese `div`. Se puede resolver con `inline: true` si hace falta.
- Los campos de flex y de grid del Contenedor se ven siempre, sea cual sea el display (se podrían ocultar con `resolveFields`).