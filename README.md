# Kaynotomia — Tema Shopify

Tema a medida (Luxwave) de [kaynotomia.com](https://kaynotomia.com). Shopify + Liquid, bilingüe ES/EN mediante localización nativa de Shopify.

---

## Regla número uno

**La sincronización con Shopify es bidireccional y no se puede desactivar.** Cuando alguien edita el tema desde el admin de Shopify —personalizador o editor de código— Shopify hace commit de ese cambio a la rama conectada, automáticamente y sin preguntar.

Esto no es un problema si el equipo respeta una separación simple:

| Quién | Dónde trabaja | Qué toca |
|---|---|---|
| Marketing / contenido | Personalizador de Shopify, sobre el **tema publicado** | Textos, imágenes, ajustes de sección |
| Desarrollo | Rama de Git + Shopify CLI en local | Archivos `.liquid`, `locales/`, `snippets/` |

**Nunca los dos a la vez sobre el mismo archivo.** El contenido de este tema vive en `templates/*.json` (por ejemplo, `page.about.json` son 3 KB de copy), así que un desarrollador editando esos archivos en una rama mientras marketing edita en el personalizador **genera conflictos sobre textos de la web**.

Si vas a tocar un `templates/*.json` desde código, avisa antes y haz `git pull` justo antes de empezar.

---

## Ramas

| Rama | Tema en Shopify | Quién publica |
|---|---|---|
| `main` | **Tema publicado** | Solo mediante pull request aprobada |
| `seo-fixes` | Tema no publicado (previsualización) | Libre |
| `feature/<nombre>` | Tema temporal, si hace falta | Libre |

**No uses "Duplicar tema" en Shopify.** Un tema conectado a GitHub pierde el vínculo con el repositorio al duplicarse. Para crear una variante: rama nueva en Git y conectarla como tema nuevo desde el admin.

---

## Trabajar en local

```bash
npm install -g @shopify/cli
shopify theme dev --store kaynotomia.myshopify.com   # previsualización con recarga en caliente
shopify theme check                                   # linter, mismo que corre en CI
```

`shopify theme dev` levanta una previsualización local contra los datos reales de la tienda **sin modificar ningún tema**. Es la forma segura de trabajar.

---

## CI

Cada pull request contra `main` ejecuta:

1. **Theme Check** — linter oficial de Shopify. Falla con nivel `error`.
2. **Validación JSON** — sintaxis de `templates/`, `config/` y `locales/`.
3. **Paridad de claves de idioma** — comprueba que `locales/es.json` tiene exactamente las mismas claves que `locales/en.default.json`.

La tercera existe por una razón concreta: si una clave existe en un idioma y no en el otro, Liquid imprime el nombre de la clave en crudo en la web (`contact.field_name` en lugar de "Nombre"). Es un fallo silencioso que no rompe nada y que nadie ve hasta que un cliente lo reporta.

---

## Estructura

```
assets/          CSS, JS y medios del tema
config/          settings_schema.json (ajustes) · settings_data.json (valores)
layout/          theme.liquid — <head>, hreflang, JSON-LD
locales/         en.default.json (principal) · es.json
sections/        Secciones. main-*.liquid son las plantillas principales
snippets/        structured-data.liquid — todo el JSON-LD
templates/       Plantillas JSON. Contienen contenido, no solo estructura
```

---

## Multilenguaje

Conviven dos sistemas, por motivos históricos:

**1. Archivos de idioma (`locales/*.json`) — el correcto.** Se usa con `{{ 'clave' | t }}`. Escala a cualquier número de idiomas. Lo usan `main-page-contact`, `main-collection`, `main-blog` y `main-article`.

**2. Condicionales en línea `{% if current_language_prefix == 'es' %}` — deuda técnica.** Quedan 48 en `nav`, `footer`, `main-product` y `main-cart`. Funcionan, pero obligan a acordarse de escribir las dos ramas en cada texto nuevo (ya se olvidó 21 veces en la página de contacto) y **solo sirven para dos idiomas**.

**Para código nuevo, usa siempre el sistema 1.** La migración del sistema 2 es mecánica y se puede hacer sección a sección.

El contenido de productos, colecciones, páginas y artículos **no** se traduce aquí: se traduce con la app Translate & Adapt en el admin.

---

## Requisitos que no están en el código

El hreflang de `layout/theme.liquid` depende de que Shopify Markets tenga la localización de URL en **modo subcarpeta** (`/es/`). Si eso no está configurado, las etiquetas apuntan todas a la misma URL y no sirven de nada.

Comprobación rápida: `https://kaynotomia.com/es/products/nimbus` debe cargar en español.
