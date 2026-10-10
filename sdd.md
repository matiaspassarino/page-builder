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
- Next.js (App Router) + TypeScript, generado con `npx create-puck-app` (recipe `next`).
- `@puckeditor/core` para editor (`<Puck>`) y render (`<Render>`).
- Estilos de componentes con inline styles / CSS variables. Sin Tailwind dentro de los componentes del builder.
- Persistencia local en archivo JSON, detrás de una capa de repositorio (ver §5).

### 3. Alcance (in scope)
- Editor en `/[...slug]/edit` y página pública en `/[...slug]` (lo que trae la recipe).
- Listado simple de páginas en `/` con link a ver/editar y botón "Nueva página" (pide slug).
- Componentes:
  - **Contenedor**: `slot` de contenido + `display` (block/flex/grid), `direccion` (row/column), `columnas` (1–6, para grid), `gap`, `padding`, `fondo` (color), `maxWidth`, `alineacion` (justify/align). Debe poder anidarse.
  - **Texto**: `texto` (textarea), `tag` (p/h1/h2/h3), `tamano`, `color`, `alineacion`.
  - **Imagen**: `src`, `alt`, `ancho` (%), `radio` (border-radius).
  - **Boton**: `texto`, `href`, `variante` (primario/secundario), `colorFondo`, `colorTexto`.
- **Campo custom de color**: input `type="color"` + input de texto hex sincronizados, reutilizable en todos los campos de color.
- Root config: título de la página y color de fondo general.

### 4. Fuera de alcance
Auth, usuarios, multi-tenant, dominios, subida de imágenes (se usan URLs), responsive por breakpoint, undo/redo propio (usar el de Puck), Supabase, deploy.

### 5. Modelo de datos y persistencia
- Una página = `{ slug: string, data: Data, updatedAt: string }`, donde `Data` es el tipo de Puck.
- Guardado en `data/pages.json` (o el archivo que use la recipe, unificado).
- **Toda lectura/escritura pasa por `lib/pages-repo.ts`** con esta interfaz:
  ```ts
  interface PagesRepo {
    list(): Promise<PageSummary[]>;
    get(slug: string): Promise<Page | null>;
    save(slug: string, data: Data): Promise<void>;
    remove(slug: string): Promise<void>;
  }
  ```
  La implementación inicial es `FilePagesRepo`. Objetivo: después reemplazarla por `SupabasePagesRepo` sin tocar UI ni rutas.
- `onPublish` del editor llama a un endpoint/server action que usa el repo.

### 6. Estructura sugerida
```
app/
  page.tsx                  # listado de páginas
  [...slug]/page.tsx        # render público
  [...slug]/edit/page.tsx   # editor
puck/
  config.tsx                # config raíz que junta todo
  components/               # un archivo por componente (fields + defaultProps + render)
  fields/ColorField.tsx     # campo custom de color
lib/
  pages-repo.ts             # interfaz + FilePagesRepo
data/
  pages.json
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