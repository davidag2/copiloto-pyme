# Copiloto Pyme

**Copiloto Pyme** es una plataforma SaaS moderna para ayudar a PYMES en Latinoamerica a tomar mejores decisiones con datos de ventas, caja, inventario, margen, alertas, integraciones y reportes ejecutivos.

El producto esta pensado para dueños, gerentes y equipos pequeños que hoy dependen de Excel, WhatsApp, sistemas contables separados y reportes atrasados para entender que esta pasando en su negocio.

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
- KPIs configurables.
- Metas y semaforos.
- Alertas configurables.
- Copiloto IA simulado con contexto del negocio.
- Vista movil optimizada.
- Historial de decisiones.
- Integraciones latinoamericanas simuladas.
- Reportes automaticos simulados con descarga `.txt`.

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

- Dueño / Gerencia
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

### 9. Historial De Decisiones

Permite registrar decisiones con:

- Descripcion.
- Responsable.
- Area de impacto.
- Estado.

Estados:

- Pendiente.
- En curso.
- Completada.

### 10. Integraciones Latinoamericanas

Integraciones simuladas:

- Google Sheets
- Siigo
- Alegra
- Mercado Pago
- Shopify
- WooCommerce

### 11. Reportes Automaticos

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

## Estructura Del Proyecto

```text
.
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
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

El MVP debe lograr que un dueño de PYME abra el panel y piense:

> Ya se que esta pasando y que tengo que hacer hoy.
