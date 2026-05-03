# Copiloto Pyme

**Copiloto Pyme** es una plataforma SaaS moderna para ayudar a PYMES en Latinoamerica a tomar mejores decisiones con datos de ventas, caja, inventario, margen, alertas, integraciones y reportes ejecutivos.

El producto esta pensado para propietarios, gerentes y equipos pequeños que hoy dependen de Excel, WhatsApp, sistemas contables separados y reportes atrasados para entender que esta pasando en su negocio.

## Vision

Crear el panel diario que le diga a una PYME:

- Que esta pasando hoy.
- Que requiere atencion.
- Que decision deberia tomar.
- Que impacto tuvieron las decisiones anteriores.

## Estado Actual

Este repositorio contiene el primer prototipo funcional del producto y el inicio de la version de produccion en **Next.js, React y TypeScript**.

Incluye:

- Portal comercial del producto.
- Registro de cliente y empresa.
- Pago de suscripcion simulado.
- Onboarding guiado.
- Dashboard principal.
- Importador real CSV.
- Importador CSV avanzado con mapeo de columnas, historial, duplicados, errores por fila y reversa.
- KPIs configurables.
- Resumen del dia compacto para lectura ejecutiva en menos de 10 segundos.
- Graficas refinadas con tendencias, comparativos, meta diaria y tooltips.
- Microinteracciones en integraciones, reglas, reportes y registro de decisiones.
- Autenticacion real con registro, login, recuperacion, invitaciones y roles por empresa.
- Multiempresa con separacion por `company_id`, permisos visibles y roles para propietario, administrador, contador, ventas y operaciones.
- Diseño mobile first con tarjetas compactas, navegacion inferior con iconos y gestos de scroll mas naturales.
- Iconografia profesional consistente con `lucide-react`.
- Metas y semaforos.
- Alertas configurables.
- Copiloto IA simulado con contexto del negocio.
- Vista movil optimizada.
- Modo claro/oscuro persistente para el dashboard.
- Historial de decisiones.
- Integraciones latinoamericanas simuladas.
- Reportes automaticos simulados con descarga `.txt`.
- API inicial con PostgreSQL para guardar empresas, usuarios, importaciones, alertas, integraciones, decisiones y reportes.
- Frontend conectado a los endpoints con fallback local si PostgreSQL aun no esta configurado.

## Producto

Nombre comercial:

**Copiloto Pyme**

Marca empresarial:

**Un producto Tecnotitan S.A.S**

## Sistema Visual De Marca

La guia oficial de marca vive en:

```text
BRAND_GUIDE.md
```

Incluye logo, paleta, tipografia, espaciado, estilos de botones, estados visuales, sombras e iconografia.

El sistema visual ejecutable esta en:

```text
brand/
```

Incluye SVG oficiales, tokens CSS, componentes JS reutilizables y una preview visual en `brand/brand-preview.html`.

## Cliente Ideal

PYMES en Latinoamerica que necesitan visibilidad diaria sobre:

- Ventas
- Caja
- Inventario
- Gastos
- Margen
- Clientes
- Alertas operativas
- Decisiones del equipo

Primeros segmentos recomendados:

- Comercios
- Distribuidoras
- Ecommerce
- Restaurantes
- Empresas de servicios

## Funcionalidades Del MVP

### 1. Portal SaaS

El prototipo incluye una pagina inicial donde el cliente puede:

- Conocer la propuesta de valor.
- Ver beneficios.
- Elegir un plan.
- Crear su usuario.
- Registrar su empresa.
- Simular el pago de la suscripcion.
- Entrar al onboarding.

### 2. Onboarding Guiado

Permite configurar:

- Tipo de negocio.
- Pais.
- Moneda.
- Meta mensual de ventas.
- Inventario minimo por producto.
- Primera fuente de datos.

### 3. Importador CSV

El sistema permite cargar archivos `.csv` con datos reales.

Columnas requeridas:

- `fecha`
- `producto`
- `ventas`
- `stock`

Columnas opcionales:

- `caja`
- `gastos`
- `margen`

Archivo de ejemplo:

[`plantilla-copiloto-pyme.csv`](./plantilla-copiloto-pyme.csv)

### 4. Dashboard Personalizable

El usuario puede mostrar u ocultar:

- Ventas
- Caja
- Margen
- Inventario
- Importador
- Productos
- Copiloto IA
- Decisiones
- Integraciones
- Reportes

Tambien puede elegir enfoque:

- Propietario / Gerencia
- Finanzas
- Ventas
- Operaciones

### 5. Metas Y Semaforos

El dashboard calcula estados visuales para:

- Meta mensual de ventas.
- Caja disponible.
- Margen minimo.
- Inventario critico.

Usa colores:

- Verde: controlado.
- Amarillo: requiere atencion.
- Rojo: riesgo alto.

### 6. Alertas Configurables

El usuario puede definir reglas para:

- Ventas bajo meta.
- Caja insuficiente.
- Margen bajo.
- Inventario critico.

### 7. Copiloto IA Simulado

El copiloto responde preguntas sobre:

- Que revisar hoy.
- Avance de meta mensual.
- Riesgo de caja.
- Inventario critico.
- Margen.
- Alertas.
- Decisiones.
- Integraciones.
- Reportes.

Tambien genera un brief ejecutivo con el contexto actual.

### 8. Vista Movil

El prototipo incluye:

- Barra movil superior.
- Navegacion inferior.
- Accesos rapidos.
- Tarjetas adaptadas.
- Tablas con scroll.
- Controles tactiles.

### 9. Modo Claro/Oscuro

El dashboard permite cambiar entre modo claro y oscuro. La preferencia se guarda en el navegador para que cada usuario mantenga su configuracion al volver al panel.

### 10. Historial De Decisiones

Permite registrar decisiones con:

- Descripcion.
- Responsable.
- Area de impacto.
- Estado.

Estados:

- Pendiente.
- En curso.
- Completada.

### 11. Integraciones Latinoamericanas

Integraciones simuladas:

- Google Sheets
- Siigo
- Alegra
- Mercado Pago
- Shopify
- WooCommerce

### 12. Reportes Automaticos

Permite configurar reportes por:

- Frecuencia: diario, semanal o mensual.
- Canal: email, WhatsApp o ambos.
- Destinatario.

El reporte incluye:

- Ventas.
- Caja.
- Margen.
- Inventario.
- Alertas.
- Decisiones.
- Integraciones.
- Accion recomendada.

### 13. Base De Datos Real

El proyecto ya incluye una primera capa backend para PostgreSQL.

Archivos principales:

- `DATABASE.md`
- `database/schema.sql`
- `prisma/schema.prisma`
- `lib/db.ts`
- `lib/api.ts`
- `app/api`

Entidades soportadas:

- Empresas.
- Usuarios.
- Lotes y filas de datos importados.
- Reglas de alerta.
- Alertas generadas.
- Integraciones.
- Decisiones.
- Reportes.

Configurar la variable:

```text
DATABASE_URL
```

Puedes partir de `.env.example`.

Endpoints iniciales:

- `GET /api/companies`
- `POST /api/companies`
- `GET /api/companies/:companyId/dashboard`
- `POST /api/imports`
- `GET /api/alerts?companyId=...`
- `POST /api/alerts`
- `GET /api/integrations?companyId=...`
- `POST /api/integrations`
- `GET /api/decisions?companyId=...`
- `POST /api/decisions`
- `GET /api/reports?companyId=...`
- `POST /api/reports`

Flujos del frontend conectados:

- Registro de empresa y usuario.
- Onboarding.
- Importador CSV.
- Alertas configurables.
- Integraciones.
- Decisiones.
- Reportes.

## Estructura Del Proyecto

```text
.
├── app/
│   ├── api/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── database/
│   └── schema.sql
├── lib/
│   ├── api.ts
│   └── db.ts
├── prisma/
│   └── schema.prisma
├── index.html
├── styles.css
├── app.js
├── plantilla-copiloto-pyme.csv
├── package.json
├── tsconfig.json
├── next.config.mjs
├── DEPLOYMENT.md
└── README.md
```

## Como Abrir El Prototipo Estatico

Abrir el archivo:

```text
index.html
```

No requiere servidor ni instalacion de dependencias.

## Como Ejecutar La Version Next.js

Instalar dependencias:

```bash
npm install
```

Ejecutar en desarrollo:

```bash
npm run dev
```

Crear build de produccion:

```bash
npm run build
```

## Tecnologia Actual

El prototipo inicial esta construido con:

- HTML
- CSS
- JavaScript vanilla

La version de produccion inicia con:

- Next.js
- React
- TypeScript
- lucide-react
- Recharts
- PostgreSQL
- pg
- Prisma
- Crypto nativo de Node.js para hash de credenciales y tokens

## Stack Recomendado Para Produccion

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:

- NestJS
- PostgreSQL
- Prisma
- Redis
- WebSockets

Datos y analitica:

- PostgreSQL
- TimescaleDB o ClickHouse
- dbt

Autenticacion y SaaS:

- Clerk, Auth0 o WorkOS
- Stripe o Mercado Pago

IA:

- OpenAI API
- pgvector para busqueda semantica

Infraestructura:

- Vercel
- AWS
- Docker
- GitHub Actions

## Roadmap Sugerido

1. Migrar prototipo a Next.js.
2. Crear autenticacion real.
3. Implementar multiempresa y roles.
4. Guardar datos en PostgreSQL.
5. Convertir importador CSV en flujo persistente.
6. Conectar Mercado Pago o Stripe.
7. Crear integracion real con Google Sheets.
8. Crear integraciones con Siigo y Alegra.
9. Implementar reportes reales por email.
10. Agregar WhatsApp Business API.
11. Conectar OpenAI API para copiloto real.
12. Crear analitica historica y predicciones.

## Objetivo Del MVP

El MVP debe lograr que un propietario de PYME abra el panel y piense:

> Ya se que esta pasando y que tengo que hacer hoy.
