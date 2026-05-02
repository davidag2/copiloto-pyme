# Sistema Visual De Marca

## Producto

**Nombre:** Copiloto Pyme

**Marca empresarial:** Un producto Tecnotitan S.A.S

**Promesa:** ayudar a las PYMES en Latinoamerica a saber que esta pasando hoy, que requiere atencion y que decision tomar con datos claros.

## Logo

El logo base del MVP es un monograma **CP** dentro de un contenedor cuadrado de 8 px de radio. Representa un copiloto operativo: simple, legible y facil de reconocer dentro de dashboards, portales y mobile apps.

Uso recomendado:

- Usar el monograma `CP` para favicon, app icon, sidebar y encabezados compactos.
- Usar `Copiloto Pyme` como wordmark textual junto al monograma en navegacion principal.
- Mantener el descriptor `Un producto Tecnotitan S.A.S` en footer, facturacion, documentos comerciales y comunicaciones formales.

## Paleta Oficial

| Token | Hex | Uso |
| --- | --- | --- |
| `--brand-primary` | `#0f9f8f` | Acciones principales, acentos de marca, progreso positivo. |
| `--brand-primary-dark` | `#08796e` | Hover, texto sobre fondos suaves, estados activos. |
| `--brand-primary-soft` | `#dff7f2` | Fondos suaves, seleccion y superficies destacadas. |
| `--brand-blue` | `#3166e0` | Enlaces, informacion, foco y elementos de analitica. |
| `--brand-blue-soft` | `#e7efff` | Fondos informativos y estados neutros activos. |
| `--brand-gold` | `#bd7b10` | Advertencias y oportunidades comerciales. |
| `--brand-navy` | `#101827` | Sidebar, cabeceras oscuras, contraste premium. |
| `--brand-ink` | `#17212f` | Texto principal. |
| `--brand-muted` | `#66758a` | Texto secundario. |

## Estados Semanticos

| Estado | Token | Hex |
| --- | --- | --- |
| Exito / controlado | `--semantic-success` | `#14945e` |
| Advertencia / atencion | `--semantic-warning` | `#bd7b10` |
| Riesgo / error | `--semantic-danger` | `#d94b4b` |
| Informacion | `--semantic-info` | `#3166e0` |

## Tipografia

La tipografia oficial del MVP es una pila sans moderna:

```css
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Reglas:

- Titulares: peso 800, line-height compacto.
- Subtitulos y labels: peso 700.
- Texto de lectura: peso 400-500, line-height amplio.
- Numeros de KPI: peso 800, siempre con contraste alto.

## Espaciado

Escala oficial:

| Token | Valor |
| --- | --- |
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |

## Radios Y Sombras

| Token | Valor | Uso |
| --- | --- | --- |
| `--radius-sm` | `6px` | Inputs, chips y elementos pequenos. |
| `--radius-md` | `8px` | Botones, cards y paneles principales. |
| `--radius-lg` | `12px` | Modales y contenedores destacados. |
| `--radius-pill` | `999px` | Badges, dots y barras de progreso. |
| `--shadow-sm` | `0 8px 22px rgba(25, 39, 58, 0.06)` | Elementos interactivos ligeros. |
| `--shadow-md` | `0 18px 50px rgba(25, 39, 58, 0.08)` | Cards y paneles. |
| `--shadow-lg` | `0 26px 80px rgba(22, 33, 47, 0.2)` | Superficies hero o capas elevadas. |

## Botones

**Primario:** fondo verde marca con hover oscuro, texto blanco, peso 700 y altura minima de 44 px.

**Secundario:** fondo blanco, borde neutral, texto principal. En hover usa fondo verde suave.

**Ghost:** fondo transparente, borde neutral, ideal para acciones de menor prioridad.

**Estados obligatorios:**

- Hover: elevar 1 px o cambiar fondo/borde.
- Active: volver a posicion normal.
- Focus visible: anillo azul accesible.
- Disabled: opacidad reducida y cursor no permitido.

## Iconografia

La direccion visual recomendada es lineal, simple y funcional. Para la version React se recomienda usar `lucide-react` cuando se instale el sistema de componentes.

Reglas:

- Trazos consistentes.
- Iconos de 18-20 px en botones y navegacion.
- No mezclar iconos rellenos con lineales salvo estados criticos.
- Evitar ilustraciones decorativas dentro del dashboard operativo.

## Voz Visual

Copiloto Pyme debe sentirse:

- Claro.
- Confiable.
- Ejecutivo.
- Cercano a la realidad de una PYME latinoamericana.
- Moderno sin parecer una landing generica.

El dashboard debe priorizar escaneo rapido, jerarquia clara y decisiones accionables.
