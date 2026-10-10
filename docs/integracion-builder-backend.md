# Integración builder ↔ backend — borrador para discutir

> Estado: **borrador**. Todo lo marcado como **[A DEFINIR]** se decide en conjunto. Lo que dice "propuesta" es un punto de partida, no una decisión tomada.

## 1. Contexto

Hasta ahora había dos proyectos en paralelo:

- **Builder** (front / UX-UI): editor visual de páginas sobre Next.js + Puck. Es el MVP de este repo.
- **Sistema del back**: automatización tipo n8n en la VPS de Hostinger. Recibe un contrato, crea el cliente, le asigna un slug y una URL genérica, configura DNS (A / CNAME) y levanta un sitio con un template base. Ya resuelve la autenticación.

La propuesta es unificarlos: **el back maneja clientes, contratos, autenticación y DNS; el builder maneja el diseño, la edición y el render de los sitios.**

### Modelo de negocio (lo que condiciona las decisiones técnicas)

1. **Pymes**: sitios autoadministrables, implementación de bajo costo y mantenimiento mensual bajo. Primer producto: **landing pages institucionales**.
2. **Empresas con problemas más complejos** (sistemas, procesos, UX): desarrollo a medida, cotizado aparte.
3. **Partners**: agencias de marketing que hoy usan Elementor, Divi, Gutenberg o Webflow, con acceso directo a los desarrolladores para soporte y funciones a medida.

Consecuencias técnicas:

| Si el negocio necesita… | …la plataforma tiene que… |
|---|---|
| Implementación barata | Crear un sitio nuevo de forma **automática**, desde el contrato hasta el sitio online, sin trabajo manual |
| Mantenimiento mensual bajo | Tener un costo por cliente bajo: **una sola app multi-cliente**, no un servidor ni un contenedor por sitio |
| Que la pyme se autoadministre | Ofrecer un editor **simple y con límites**: bloques curados, estilos de marca predefinidos y difícil de romper |
| Que el mensual tenga valor sostenido | Incluir hosting, dominio, HTTPS, formularios, backups y mejoras continuas. El abono paga el servicio, no la retención del sitio |
| **Que el sitio sea del cliente** (decisión tomada, ver §6) | Poder **exportar** cualquier sitio en cualquier momento, con sus personalizaciones, más una guía para montarlo en otro hosting |
| Atender agencias partner | Permitir que **una organización administre varios sitios**, con roles. Más adelante, posiblemente marca blanca |
| Funciones a medida | Permitir **bloques propios por cliente o por plan** (bloques premium) sin bifurcar el código |

## 2. Qué existe hoy

**Builder (este repo):**
- Editor en `/<slug>/edit` y render público en `/<slug>`.
- Bloques: Contenedor (anidable; block, flex o grid), Texto, Imagen (por URL), Botón y la configuración de página (título y fondo).
- Persistencia detrás de la interfaz `PagesRepo` (`list`, `get`, `save`, `remove`). Hoy guarda en un archivo JSON. **Está pensada para cambiar a una base de datos sin tocar la UI.**
- Sin autenticación ni multi-cliente.
- Detalle completo en [sdd.md](../sdd.md).

**Sistema del back** (según lo que sabemos; **a confirmar**):
- Flujo de contrato → cliente → slug → URL genérica → DNS → sitio desde un template.
- Autenticación resuelta.
- Base de datos: **[A DEFINIR]**.

## 3. Arquitectura propuesta

```
 Contrato nuevo
      │
      ▼
┌──────────────────────┐  webhook: cliente creado / cambió   ┌─────────────────────────┐
│ Sistema del back     │ ──────────────────────────────────► │ Builder (Next.js + Puck)│
│ · contratos y planes │                                     │ · crea el sitio desde   │
│ · autenticación      │ ◄────────────────────────────────── │   un template           │
│ · DNS                │   ¿este usuario puede editar X?     │ · editor                │
│ · automatizaciones   │                                     │ · render público        │
│   (formularios, etc.)│ ◄────────────────────────────────── │                         │
└──────────────────────┘   webhook: llegó un formulario      └────────────┬────────────┘
                                                                          │
     cliente.dominio-plataforma.com ─┐                                    │
     www.dominio-del-cliente.com ────┴──► Proxy + certificados (VPS) ─────┘
```

Una **única app del builder** sirve a todos los sitios. Identifica el sitio por el dominio de cada request (`Host`) y renderiza sus páginas.

## 4. Responsabilidades

| Tema | Back | Builder |
|---|---|---|
| Contratos, planes y facturación | ✅ | — |
| Alta, baja y suspensión de clientes | ✅ (origen) | Reacciona al webhook |
| Autenticación de usuarios | ✅ | Valida la sesión contra el back |
| Permisos ("¿puede editar este sitio?") | **[A DEFINIR]** | **[A DEFINIR]** |
| DNS (A / CNAME) | ✅ | — |
| Certificados HTTPS para dominios propios | **[A DEFINIR]** (proxy de la VPS) | — |
| Mapa dominio → sitio | ✅ (origen) | Lo consulta o lo replica |
| Páginas (JSON de Puck) | — | ✅ |
| Templates base | — | ✅ (son páginas de Puck) |
| Imágenes subidas | **[A DEFINIR]** (almacenamiento) | ✅ (subida desde el editor) |
| Formularios de contacto | ✅ (procesa: mail, CRM, n8n) | ✅ (bloque y envío) |
| Deploy y backups de la VPS | ✅ | Provee el build |

## 5. Contratos de integración (propuesta)

### 5.1 Webhook de ciclo de vida del cliente (back → builder)

`POST /api/hooks/sites`, firmado con un secreto compartido en el header `X-Signature` (HMAC-SHA256 del body).

```json
{
  "event": "site.created",
  "siteId": "c_8f3a…",
  "orgId": "o_12ab…",
  "slug": "panaderia-lopez",
  "plan": "basico",
  "template": "institucional-1",
  "domains": ["panaderia-lopez.dominio-plataforma.com"]
}
```

Eventos: `site.created`, `site.updated` (plan o dominios), `site.suspended`, `site.deleted`.
El builder responde `200` y es **idempotente**: recibir dos veces el mismo evento no duplica nada.

### 5.2 Autenticación

Dos opciones, según cómo funcione hoy el back **[A DEFINIR]**:

- **A — Token firmado (JWT).** El back emite un JWT y el builder lo verifica con una clave pública del back (JWKS). No hace falta una llamada por request. Claims mínimos: `sub` (usuario), `orgId` y `sites` o `roles`.
- **B — Introspección.** El builder le pregunta al back en cada request: `GET /auth/session` → `{ userId, orgId, roles, sites }`. Es más simple de implementar, a costa de una llamada extra (con un caché corto).

En los dos casos el editor (`/<slug>/edit`) y las acciones de guardado **exigen** una sesión válida con permiso sobre ese sitio. El render público no requiere sesión.

### 5.3 Ruteo por dominio

El `proxy.ts` del builder lee el header `Host`, busca el sitio y reescribe internamente la URL a `/_sites/<siteId>/<slug>`.

- Fuente del mapa dominio → sitio: tabla propia del builder, alimentada por los webhooks (propuesta), o consulta al back con caché.
- Dominio desconocido → 404 o página de "sitio no encontrado".
- Sitio suspendido → página de "sitio suspendido".

### 5.4 Formularios (builder → back)

El bloque "Formulario de contacto" envía los datos al builder, que los valida, aplica rate limiting y los reenvía a un webhook del back (por ejemplo, un flujo de n8n) con `{ siteId, formId, campos, fecha }`. El back decide qué hacer: mail, CRM, WhatsApp.

### 5.5 Planes y bloques premium

El plan llega por el webhook (5.1). El builder arma la lista de bloques del editor según el plan: los premium aparecen bloqueados o no aparecen. **Además lo valida al guardar**, porque una restricción que solo vive en el navegador se puede saltear.

## 6. Portabilidad: el sitio es del cliente

**Decisión de contrato:** si el cliente da de baja el servicio, se le entrega el sitio, las personalizaciones que hizo y una guía para montarlo en otro hosting.

Esto se diseña desde el principio, porque es caro de agregar después.

### Qué se entrega (propuesta: dos niveles)

| Nivel | Contenido | Dónde funciona | Edición |
|---|---|---|---|
| **1 — Sitio estático** (siempre) | HTML + CSS + imágenes de todas las páginas, listos para subir | Cualquier hosting (incluso compartido o gratuito) | No: se edita el HTML a mano o se rehace |
| **2 — Paquete autoadministrable** (a definir si entra en todos los planes) | Los datos del sitio (JSON de Puck, tema, imágenes) + una versión del builder lista para correr (por ejemplo, una imagen de Docker) con los bloques que usa el sitio | Un servidor con Node o Docker | Sí, con el mismo editor |

En los dos casos se incluyen los **datos crudos** (JSON de páginas y tema, imágenes originales) y la **guía de montaje**.

### Requisitos técnicos que salen de esta decisión

- **Exportador por sitio**: genera el paquete desde el panel, a pedido. No es algo manual que se hace cuando alguien se va.
- **Los bloques no pueden depender sin remedio de la plataforma.** Lo que necesita un backend (por ejemplo, los formularios) tiene que tener una alternativa documentada en la exportación: un servicio externo de formularios o un `mailto:`.
- **Las imágenes se guardan en su forma original** y con nombres legibles, no solo como versiones optimizadas.
- **Las URLs se conservan** (mismos slugs), así el sitio exportado no pierde SEO.
- **El dominio queda registrado a nombre del cliente** desde el día uno. Si lo registramos nosotros, transferirlo es la parte más conflictiva de una baja.

### Puntos a definir con un abogado o contador [A DEFINIR]

- **Qué es "el producto"**: el contenido, el diseño, los datos y las personalizaciones hechas para ese cliente son suyos. ¿Y el código de la plataforma, que es compartido entre todos los clientes? Propuesta: el cliente recibe una **licencia de uso perpetua** del código que necesita su sitio, sin derecho a revenderlo como plataforma.
- **Los desarrollos a medida** (bloques o funciones hechas para un cliente): ¿son del cliente, o se pueden reutilizar en otros proyectos?
- **Los componentes de terceros**: Puck es MIT, así que no hay problema. Hay que revisar las licencias de cualquier librería o tipografía que se sume.

## 7. Modelo de datos del builder (propuesta, PostgreSQL)

```sql
create table sites (
  id          text primary key,          -- viene del back
  org_id      text not null,
  slug        text not null unique,
  plan        text not null,
  status      text not null default 'active',  -- active | suspended
  theme       jsonb not null default '{}',     -- colores y tipografías de marca
  created_at  timestamptz not null default now()
);

create table site_domains (
  domain      text primary key,
  site_id     text not null references sites(id) on delete cascade
);

create table pages (
  site_id     text not null references sites(id) on delete cascade,
  slug        text not null,               -- '' = home
  data        jsonb not null,              -- JSON de Puck
  status      text not null default 'published',
  updated_at  timestamptz not null default now(),
  updated_by  text,
  primary key (site_id, slug)
);

create table templates (
  id          text primary key,            -- 'institucional-1'
  name        text not null,
  pages       jsonb not null               -- [{ slug, data }]
);

create table assets (
  id          text primary key,
  site_id     text not null references sites(id) on delete cascade,
  path        text not null,               -- ubicación en el almacenamiento
  mime        text not null,
  size_bytes  integer not null,
  created_at  timestamptz not null default now()
);
```

¿Una base propia del builder o tablas dentro de la base del back? **[A DEFINIR]**. Si el back ya usa PostgreSQL, puede ser la misma instancia con un esquema separado.

La interfaz `PagesRepo` pasa a recibir el sitio: `get(siteId, slug)`, `save(siteId, slug, data)`, etc.

## 8. Qué tiene que construir el builder (orden propuesto)

1. **Multi-cliente**: `siteId` en el repo, ruteo por dominio y repo sobre PostgreSQL.
2. **Autenticación** integrada con el back (5.2) y protección del editor.
3. **Webhook de sitios** (5.1) y creación desde un template.
4. **Subida de imágenes** y biblioteca de medios por sitio.
5. **SEO por página**: descripción, imagen para compartir y favicon del sitio.
6. **Bloque de formulario** (5.4).
7. **Tema de marca por sitio** (colores y tipografías) y bloques para landing: hero, features, testimonios, footer, mapa.
8. **Exportador de sitios** (§6): sitio estático primero; paquete autoadministrable después.
9. **Mejoras del editor**: categorías, íconos y bloques premium (5.5).

## 9. Preguntas para el back

1. ¿Cómo se "levanta el sitio con el template base" hoy? ¿Archivos estáticos, un contenedor por cliente, otra app? **Define si el builder reemplaza esa parte o convive con ella.**
2. ¿Cómo funciona la autenticación (JWT, sesiones, OAuth)? ¿Opción A o B de 5.2?
3. ¿Qué base de datos se usa?
4. ¿Qué proxy corre en la VPS (Nginx, Caddy, Traefik)? ¿Cómo se emiten los certificados de los dominios de los clientes?
5. ¿El sistema puede disparar webhooks en el alta, la baja, la suspensión y el cambio de plan?
6. ¿Cómo se despliega (Docker, PM2)? ¿Hay CI?
7. ¿Dónde guardar las imágenes: disco de la VPS con backups, o almacenamiento compatible con S3 (por ejemplo MinIO)?
8. ¿Qué recursos tiene la VPS (RAM, CPU, disco)? ¿Cuántos sitios esperamos el primer año?

## 10. Decisiones de producto que afectan lo técnico

- **Planes**: qué incluye cada uno (cantidad de páginas, bloques, formularios, dominio propio).
- **Qué incluye el mantenimiento mensual**: hosting, cambios hechos por nosotros, soporte, horas.
- **Salida del cliente**: decidido, el sitio es del cliente (§6). Falta definir si el paquete autoadministrable (nivel 2) entra en todos los planes y cómo se redacta en el contrato.
- **Agencias partner**: ¿administran varios sitios desde una cuenta? ¿Marca blanca? ¿Cómo se canaliza el soporte (tickets, canal directo)?
- **Roles**: dueño, editor, partner, admin de la plataforma.
- **Naming y dominio de la plataforma**: se necesitan para las URLs genéricas (`cliente.<dominio>`).
