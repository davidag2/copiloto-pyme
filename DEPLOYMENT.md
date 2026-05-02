# Deployment

Copiloto Pyme actualmente es un prototipo web estatico. Puede desplegarse sin proceso de build.

## Opcion Recomendada: Vercel

1. Subir este repositorio a GitHub.
2. Entrar a Vercel.
3. Importar el repositorio.
4. Usar configuracion:
   - Framework preset: `Other`
   - Build command: vacio
   - Output directory: raiz del proyecto
5. Publicar.

## Alternativas

- Netlify
- Cloudflare Pages
- GitHub Pages

## Archivos Necesarios

- `index.html`
- `styles.css`
- `app.js`
- `plantilla-copiloto-pyme.csv`

## Futuro SaaS

Cuando el producto migre a Next.js, el deployment recomendado sera:

- Frontend: Vercel
- Backend: AWS, Render, Railway o Fly.io
- Base de datos: PostgreSQL
- Autenticacion: Clerk, Auth0 o WorkOS
- Pagos: Mercado Pago o Stripe
