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
5. Crear una base PostgreSQL administrada.
6. Configurar variables de entorno:
   - `DATABASE_URL`
   - `DATABASE_SSL=true` si el proveedor exige SSL.
7. Aplicar el esquema:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

8. Publicar.

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

## Base De Datos

El esquema productivo vive en:

```text
database/schema.sql
```

El modelo Prisma de referencia vive en:

```text
prisma/schema.prisma
```

Proveedores recomendados para el MVP:

- Vercel Postgres / Neon.
- Supabase.
- Railway PostgreSQL.
- Render PostgreSQL.

## Futuro SaaS

Con backend real, el deployment recomendado sera:

- Frontend: Vercel
- Backend/API: Next.js Route Handlers en Vercel al inicio; NestJS separado cuando escale.
- Base de datos: PostgreSQL administrado.
- Autenticacion: Clerk, Auth0 o WorkOS
- Pagos: Mercado Pago o Stripe
