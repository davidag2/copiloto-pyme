# Copiloto Pyme Brand System

Sistema visual oficial para **Copiloto Pyme**, un asistente IA para PYMES que necesitan tomar mejores decisiones con datos de ventas, caja, inventario y alertas operativas.

## Concepto

La marca usa el concepto **AI Assistant Orb**: una esfera inteligente, amable y profesional que comunica tecnologia, acompanamiento y claridad. El orb evita verse infantil: usa un gradiente limpio, nucleo interno, orbita sutil y animaciones suaves.

## Estructura

```text
brand/
  assets/
    logo.svg
    logo-horizontal.svg
    logo-icon.svg
    favicon.svg
  css/
    brand-tokens.css
    buttons.css
    shadows.css
    typography.css
  components/
    AiOrb.js
    BrandHeader.js
    Button.js
    Card.js
  brand-preview.html
  README.md
```

## Colores

| Color | Hex | Uso |
| --- | --- | --- |
| Primary dark blue | `#0A2540` | Confianza, headers, navegacion premium, texto principal. |
| Electric blue | `#2563EB` | Acciones principales, foco, links y datos activos. |
| Success green | `#22C55E` | CTA, progreso, estados positivos y orb gradient. |
| Dark neutral | `#1F2937` | Texto operativo y UI oscura secundaria. |
| Light neutral | `#F3F4F6` | Fondos de app, superficies suaves. |
| White | `#FFFFFF` | Cards, paneles y contraste. |

## Logo

Archivos:

- `assets/logo.svg`: version principal.
- `assets/logo-horizontal.svg`: version para header y barras de navegacion.
- `assets/logo-icon.svg`: orb completo para app icon, avatar y splash.
- `assets/favicon.svg`: orb simplificado para navegador.

Uso:

- En fondos claros, usar `logo.svg` o `logo-horizontal.svg`.
- En fondos oscuros, usar el icono o el horizontal con suficiente contraste.
- Mantener espacio libre alrededor igual al radio del orb.
- No cambiar el gradiente base `linear-gradient(135deg, #2563EB, #22C55E)`.

## Tipografia

Inter es la fuente principal de interfaz.

Poppins se usa para titulares display cuando este disponible.

Fallback:

```css
Inter, system-ui, sans-serif
Poppins, Inter, system-ui, sans-serif
```

## Botones

Las clases viven en `css/buttons.css`.

- `.btn.btn-primary`: azul, accion principal.
- `.btn.btn-secondary`: transparente con borde azul.
- `.btn.btn-cta`: verde, conversion o accion comercial.
- `.btn.btn-ghost`: navegacion o accion secundaria.

Todos incluyen `hover`, `active`, `disabled` y `focus-visible`.

## Espaciado

Sistema basado en 8 px:

| Token | Valor |
| --- | --- |
| `--space-xs` | `4px` |
| `--space-sm` | `8px` |
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `32px` |
| `--space-2xl` | `48px` |

## Sombras

Tokens en `css/shadows.css`:

```css
--shadow-soft: 0px 4px 12px rgba(0,0,0,0.08);
--shadow-medium: 0px 10px 25px rgba(0,0,0,0.12);
--shadow-strong: 0px 20px 40px rgba(0,0,0,0.18);
--shadow-orb: 0 0 24px rgba(37, 99, 235, 0.4);
```

## AI Orb

`components/AiOrb.js` expone:

- `createAiOrb({ state })`
- `setAiOrbState(orb, state)`
- `mountAiOrbs(root)`

Estados:

- `idle`: glow suave.
- `listening`: pulso lento.
- `thinking`: rotacion amable.
- `speaking`: onda de escala sutil.
- `inactive`: gris y baja opacidad.

## Como Usar

Para una pagina HTML:

```html
<link rel="stylesheet" href="./css/brand-tokens.css">
<link rel="stylesheet" href="./css/typography.css">
<link rel="stylesheet" href="./css/buttons.css">
<link rel="stylesheet" href="./css/shadows.css">
<img src="./assets/logo-horizontal.svg" alt="Copiloto Pyme">
<button class="btn btn-primary">Continuar</button>
```

Para ver la guia visual:

```text
brand/brand-preview.html
```

La preview muestra logos, paleta, tipografia, botones, cards, estados del orb y un ejemplo de header SaaS.
