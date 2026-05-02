# Deployment

Copiloto Pyme tiene una version inicial en Next.js, React y TypeScript. El prototipo HTML estatico se conserva como referencia historica.

## Opcion Recomendada: Vercel

1. Subir este repositorio a GitHub.
2. Entrar a Vercel.
3. Importar el repositorio.
4. Usar configuracion:
   - Framework preset: `Next.js`
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output directory: `.next`
5. Publicar.

## Alternativas

- Netlify
- Cloudflare Pages
- GitHub Pages

## Comandos

```bash
npm install
npm run build
npm run start
```

## Futuro SaaS

Cuando el producto incorpore backend real, el deployment recomendado sera:

- Frontend: Vercel
- Backend: AWS, Render, Railway o Fly.io
- Base de datos: PostgreSQL
- Autenticacion: Clerk, Auth0 o WorkOS
- Pagos: Mercado Pago o Stripe
