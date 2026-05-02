# Sistema Visual De Marca

## Producto

**Nombre:** Copiloto Pyme

**Marca empresarial:** Un producto Tecnotitan S.A.S

**Promesa:** ayudar a las PYMES en Latinoamerica a saber que esta pasando hoy, que requiere atencion y que decision tomar con datos claros.

## Logo

El logo oficial del sistema de marca es el concepto **AI Assistant Orb**: una esfera circular con gradiente azul-verde, brillo sutil, nucleo interno y detalle orbital. Representa un copiloto inteligente, vivo y confiable sin perder sobriedad SaaS.

Uso recomendado:

- Usar `brand/assets/logo-icon.svg` para app icon, sidebar y encabezados compactos.
- Usar `brand/assets/logo-horizontal.svg` como wordmark en navegacion principal.
- Usar `brand/assets/favicon.svg` como icono de navegador.
- Mantener el descriptor `Un producto Tecnotitan S.A.S` en footer, facturacion, documentos comerciales y comunicaciones formales.

## Paleta Oficial

| Token | Hex | Uso |
| --- | --- | --- |
| `--brand-primary` | `#0A2540` | Confianza, headers, navegacion premium y texto principal. |
| `--brand-primary-dark` | `#071A2D` | Hover oscuro y fondos de alto contraste. |
| `--brand-primary-soft` | `#EAF1FF` | Fondos suaves de marca. |
| `--brand-blue` | `#2563EB` | Acciones principales, enlaces, foco y analitica activa. |
| `--brand-blue-soft` | `#DBEAFE` | Fondos informativos y estados activos. |
| `--brand-green` | `#22C55E` | CTA, exito, progreso y componente vivo del orb. |
| `--brand-green-soft` | `#DCFCE7` | Fondos positivos suaves. |
| `--brand-gold` | `#bd7b10` | Advertencias y oportunidades comerciales. |
| `--brand-navy` | `#0A2540` | Sidebar, cabeceras oscuras, contraste premium. |
| `--brand-ink` | `#1F2937` | Texto principal. |
| `--brand-muted` | `#667085` | Texto secundario. |

## Estados Semanticos

| Estado | Token | Hex |
| --- | --- | --- |
| Exito / controlado | `--semantic-success` | `#22C55E` |
| Advertencia / atencion | `--semantic-warning` | `#bd7b10` |
| Riesgo / error | `--semantic-danger` | `#d94b4b` |
| Informacion | `--semantic-info` | `#2563EB` |

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

**Primario:** fondo azul electrico con hover oscuro, texto blanco, peso 700 y altura minima de 44 px.

**Secundario:** fondo blanco, borde neutral, texto principal. En hover usa fondo azul suave.

**CTA:** fondo verde exito, texto blanco, reservado para conversion, pago, activacion o acciones de alto valor.

**Ghost:** fondo transparente, borde neutral, ideal para acciones de menor prioridad.

**Estados obligatorios:**

- Hover: elevar 1 px o cambiar fondo/borde.
- Active: volver a posicion normal.
- Focus visible: anillo azul accesible.
- Disabled: opacidad reducida y cursor no permitido.

## Iconografia

La direccion visual recomendada es lineal, simple y funcional. Para la version React se recomienda usar `lucide-react` cuando se instale el sistema de componentes.

El paquete completo de marca vive en `brand/` e incluye SVG, tokens CSS, botones, sombras, tipografia, componentes JS y preview visual.

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
