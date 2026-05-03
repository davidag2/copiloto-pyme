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

El modelo Prisma de referencia esta en:

```text
prisma/schema.prisma
```

## 3. Entidades Persistidas

- Empresas.
- Usuarios.
- Lotes de importacion.
- Filas de datos importados.
- Reglas de alerta.
- Alertas.
- Integraciones.
- Decisiones.
- Reportes.

## 4. Endpoints

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

## 5. Siguiente Paso Recomendado

Conectar el frontend actual a estos endpoints para que registro, onboarding, importador CSV, decisiones y reportes dejen de vivir solo en estado local.
