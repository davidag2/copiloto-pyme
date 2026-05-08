# Base De Datos Real

Copiloto Pyme ya tiene una primera capa PostgreSQL para persistir datos reales del SaaS.

## 1. Configuracion

Crear `.env` a partir de `.env.example`:

```text
DATABASE_URL="postgresql://copiloto_user:copiloto_password@localhost:5432/copiloto_pyme?schema=public"
```

Si el proveedor exige SSL:

```text
DATABASE_SSL=true
```

## 2. Crear Tablas

Aplicar el esquema SQL:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

O usando los scripts del proyecto:

```bash
npm run db:check
npm run db:audit
npm run db:apply
npm run db:seed
```

En PowerShell, si `npm.ps1` esta bloqueado por la politica de ejecucion de Windows, usar Node directamente:

```bash
node scripts/db/check.mjs
node scripts/db/audit-schema.mjs
node scripts/db/apply-schema.mjs
node scripts/db/seed-demo.mjs
```

El modelo Prisma de referencia esta en:

```text
prisma/schema.prisma
```

## 3. Entidades Persistidas

- Empresas.
- Usuarios.
- Recuperacion de contrasena.
- Invitaciones de equipo.
- Lotes de importacion.
- Filas de datos importados.
- Reglas de alerta.
- Alertas.
- Integraciones.
- Decisiones.
- Reportes.

## 4. Auditoria Del Paso 2

Resultado local validado contra PostgreSQL:

- Conexion OK: base `copiloto_pyme`, usuario `postgres`.
- Tablas existentes: `companies`, `users`, `password_reset_tokens`, `team_invitations`, `imported_data_batches`, `imported_data_rows`, `alert_rules`, `alerts`, `integrations`, `decisions`, `reports`.
- Registro API existente: `POST /api/auth/register` crea empresa, usuario propietario, reglas e integraciones por defecto.
- Login API existente: `POST /api/auth/login` valida email, contrasena cifrada y devuelve usuario, empresa y token temporal.
- Roles existentes: `propietario`, `administrador`, `contador`, `ventas`.

Brechas para conectar el portal comercial a produccion:

- Falta tabla `plans` para definir Go, Basic y Pro como datos reales.
- Falta tabla `subscriptions` para guardar plan, estado trial, fechas e historial.
- Falta tabla `sessions` para guardar sesiones reales en base de datos o cookies seguras.
- Falta tabla `onboarding_progress` para saber si la empresa debe ir a onboarding o dashboard.
- `prisma/schema.prisma` esta desactualizado frente a `database/schema.sql`; por ahora la fuente operativa es SQL + `pg`.

## 5. Endpoints

### Registro Comercial

Modelo definido para `POST /api/auth/register`:

```json
{
  "companyName": "Distribuidora Andina",
  "ownerName": "Diana Gomez",
  "ownerEmail": "diana@andina.com",
  "password": "minimo-8-caracteres",
  "plan": "go"
}
```

Planes validos:

| Plan | Precio mensual | Trial |
| --- | ---: | --- |
| Go | COP $20.000 | 30 dias |
| Basic | COP $50.000 | 30 dias |
| Pro | COP $100.000 | 30 dias |

Respuesta esperada del modelo de registro:

```json
{
  "company": {},
  "user": {},
  "session": {
    "token": "temporal",
    "expiresIn": "demo-session"
  },
  "registration": {
    "plan": {
      "id": "go",
      "name": "Go",
      "priceCop": 20000,
      "trialDays": 30
    },
    "trial": {
      "status": "trial",
      "startsAt": "fecha ISO",
      "endsAt": "fecha ISO"
    },
    "nextStep": "/onboarding"
  }
}
```

Este contrato ya esta preparado en codigo, pero en el Paso 4 debe persistirse en `plans`, `subscriptions`, `sessions` y `onboarding_progress`.

Crear empresa y usuario propietario:

```http
POST /api/companies
```

```json
{
  "companyName": "Distribuidora Andina",
  "ownerName": "Diana Gomez",
  "ownerEmail": "diana@andina.com",
  "country": "Colombia",
  "businessType": "Distribuidora",
  "currency": "COP",
  "plan": "Crecimiento",
  "monthlyGoal": 100000000,
  "minimumStock": 10,
  "dataSource": "Excel/CSV"
}
```

Consultar dashboard persistido:

```http
GET /api/companies/:companyId/dashboard
```

Guardar importacion CSV:

```http
POST /api/imports
```

```json
{
  "companyId": "uuid",
  "source": "CSV",
  "fileName": "ventas-abril.csv",
  "rows": [
    {
      "fecha": "2026-04-23",
      "producto": "Cafe Premium 500g",
      "ventas": 18400000,
      "stock": 8,
      "caja": 27600000,
      "gastos": 2200000,
      "margen": 32
    }
  ]
}
```

Guardar decision:

```http
POST /api/decisions
```

```json
{
  "companyId": "uuid",
  "text": "Reponer inventario critico antes del viernes",
  "owner": "Operaciones",
  "impact": "Inventario",
  "status": "Pendiente"
}
```

Guardar alerta:

```http
POST /api/alerts
```

Guardar integracion:

```http
POST /api/integrations
```

Guardar reporte:

```http
POST /api/reports
```

## 6. Siguiente Paso Recomendado

El frontend ya intenta guardar en estos endpoints para:

- Registro.
- Onboarding.
- Importador CSV.
- Alertas.
- Integraciones.
- Decisiones.
- Reportes.

Si `DATABASE_URL` no esta configurado o PostgreSQL no esta disponible, la experiencia sigue funcionando en modo demo local y muestra el estado de persistencia en el dashboard.

El siguiente paso recomendado para el flujo Login/Crear cuenta es ampliar `database/schema.sql` con `plans`, `subscriptions`, `sessions` y `onboarding_progress`, y despues conectar `/register?plan=go|basic|pro` con `POST /api/auth/register`.

## 7. Prueba Completa

1. Crear `.env` con `DATABASE_URL`.
2. Ejecutar `npm run db:check`.
3. Ejecutar `npm run db:audit`.
4. Ejecutar `npm run db:apply`.
5. Ejecutar `npm run db:seed`.
6. Ejecutar `npm run dev`.
7. Abrir el dashboard, registrar una empresa, importar CSV, crear una decision y generar un reporte.
