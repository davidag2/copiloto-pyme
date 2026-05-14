import { fail, ok, requiredString } from "@/lib/api";
import { calculateSuggestionImpact } from "@/lib/ai-impact";
import { query } from "@/lib/db";
import { requireCompanySession } from "@/lib/session";

const defaultSuggestions = [
  {
    category: "inventario",
    priority: "critical",
    title: "Reponer Panela Orgánica",
    description: "Quedan pocas unidades y las ventas subieron 12% esta semana.",
    recommendation: "Enviar orden a compras hoy y revisar proveedor alterno.",
    impactLabel: "+ $1.250.000 en ventas",
    impactValueCop: 1250000,
    confidence: 91
  },
  {
    category: "precios",
    priority: "high",
    title: "Aumentar precio en Café Premium",
    description: "Tu margen está 18% menor que el promedio del mercado.",
    recommendation: "Subir precio de forma gradual y medir elasticidad durante 7 días.",
    impactLabel: "+ $890.000 en margen",
    impactValueCop: 890000,
    confidence: 84
  },
  {
    category: "inventario",
    priority: "medium",
    title: "Stock bajo en 2 productos",
    description: "Riesgo de quiebre de inventario en los próximos 5 días.",
    recommendation: "Revisar compras pendientes y confirmar fechas de entrega.",
    impactLabel: "Revisar compras hoy",
    impactValueCop: null,
    confidence: 78
  }
];

async function getSuggestions(companyId: string) {
  return query(
    `SELECT id,
            company_id AS "companyId",
            category,
            priority,
            title,
            description,
            recommendation,
            impact_type AS "impactType",
            impact_label AS "impactLabel",
            impact_value_cop AS "impactValueCop",
            confidence,
            status,
            evidence,
            metadata,
            suggested_for_date AS "suggestedForDate",
            generated_at AS "generatedAt"
     FROM ai_suggestions
     WHERE company_id = $1
       AND status <> 'descartada'
     ORDER BY
       CASE priority
         WHEN 'critical' THEN 1
         WHEN 'high' THEN 2
         WHEN 'medium' THEN 3
         ELSE 4
       END,
       generated_at DESC
     LIMIT 20`,
    [companyId]
  );
}

async function seedDefaultSuggestions(companyId: string) {
  const existing = await query(
    `SELECT id
     FROM ai_suggestions
     WHERE company_id = $1
       AND source = 'copiloto_ai_demo_seed'
     LIMIT 1`,
    [companyId]
  );

  if (existing.rows.length) return;

  await Promise.all(defaultSuggestions.map(async (suggestion) => {
    const impact = await calculateSuggestionImpact(companyId, suggestion.category, suggestion.priority);
    return query(
      `INSERT INTO ai_suggestions (
       company_id,
       source,
       category,
       priority,
       title,
       description,
       recommendation,
       impact_type,
       impact_label,
       impact_value_cop,
       confidence,
       evidence,
       metadata
     )
     VALUES ($1, 'copiloto_ai_demo_seed', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb)`,
      [
        companyId,
        suggestion.category,
        suggestion.priority,
        suggestion.title,
        suggestion.description,
        suggestion.recommendation,
        impact.impactType,
        impact.impactLabel || suggestion.impactLabel,
        impact.impactValueCop || suggestion.impactValueCop,
        suggestion.confidence,
        JSON.stringify({ generatedFrom: ["sales", "cash", "inventory"], impact: impact.evidence }),
        JSON.stringify({ seed: true, version: 2 })
      ]
    );
  }));
}

async function refreshSuggestionImpacts(companyId: string) {
  const suggestions = await query<{ id: string; category: string; priority: string }>(
    `SELECT id, category, priority
     FROM ai_suggestions
     WHERE company_id = $1
       AND status <> 'descartada'
       AND source <> 'copiloto_ai_sales_analysis'
     ORDER BY generated_at DESC
     LIMIT 20`,
    [companyId]
  );

  await Promise.all(suggestions.rows.map(async (suggestion) => {
    const impact = await calculateSuggestionImpact(companyId, suggestion.category, suggestion.priority);
    return query(
      `UPDATE ai_suggestions
       SET impact_type = $2,
           impact_label = $3,
           impact_value_cop = $4,
           evidence = evidence || $5::jsonb,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $6`,
      [
        suggestion.id,
        impact.impactType,
        impact.impactLabel,
        impact.impactValueCop,
        JSON.stringify({ impact: impact.evidence }),
        companyId
      ]
    );
  }));
}

function moneyLabel(value: number, suffix: string) {
  const formatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Math.max(0, Math.round(value)));
  return `${formatted} ${suffix}`;
}

function percent(value: number) {
  return `${Math.round(value)}%`;
}

async function upsertSalesAnalysisSuggestion(companyId: string, suggestion: {
  analysisKey: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  impactType: "ventas_adicionales" | "margen" | "ahorro" | "riesgo_evitado";
  impactLabel: string;
  impactValueCop: number;
  confidence: number;
  evidence: Record<string, unknown>;
}) {
  const existing = await query<{ id: string }>(
    `SELECT id
     FROM ai_suggestions
     WHERE company_id = $1
       AND source = 'copiloto_ai_sales_analysis'
       AND metadata->>'analysisKey' = $2
       AND status <> 'descartada'
     LIMIT 1`,
    [companyId, suggestion.analysisKey]
  );

  if (existing.rows[0]) {
    await query(
      `UPDATE ai_suggestions
       SET category = $3,
           priority = $4,
           title = $5,
           description = $6,
           recommendation = $7,
           impact_type = $8,
           impact_label = $9,
           impact_value_cop = $10,
           confidence = $11,
           evidence = $12::jsonb,
           metadata = $13::jsonb,
           suggested_for_date = CURRENT_DATE,
           generated_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2`,
      [
        existing.rows[0].id,
        companyId,
        suggestion.category,
        suggestion.priority,
        suggestion.title,
        suggestion.description,
        suggestion.recommendation,
        suggestion.impactType,
        suggestion.impactLabel,
        suggestion.impactValueCop,
        suggestion.confidence,
        JSON.stringify({ generatedFrom: ["sales_orders", "sales_order_items"], ...suggestion.evidence }),
        JSON.stringify({ analysisKey: suggestion.analysisKey, module: "ventas", version: 1 })
      ]
    );
    return;
  }

  await query(
    `INSERT INTO ai_suggestions (
       company_id,
       source,
       category,
       priority,
       title,
       description,
       recommendation,
       impact_type,
       impact_label,
       impact_value_cop,
       confidence,
       evidence,
       metadata
     )
     VALUES ($1, 'copiloto_ai_sales_analysis', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb)`,
    [
      companyId,
      suggestion.category,
      suggestion.priority,
      suggestion.title,
      suggestion.description,
      suggestion.recommendation,
      suggestion.impactType,
      suggestion.impactLabel,
      suggestion.impactValueCop,
      suggestion.confidence,
      JSON.stringify({ generatedFrom: ["sales_orders", "sales_order_items"], ...suggestion.evidence }),
      JSON.stringify({ analysisKey: suggestion.analysisKey, module: "ventas", version: 1 })
    ]
  );
}

async function generateSalesAnalysisSuggestions(companyId: string) {
  const [trend, lowRotation, frequentCustomer, weakChannel, discounts, pending, strongDay, promo, weeklyProductDrop, channelComparison, topProductStock, inactiveCustomer] = await Promise.all([
    query<{ recentSales: string; previousSales: string; recentOrders: string }>(
      `SELECT COALESCE(SUM(total) FILTER (WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days' AND status <> 'anulada'), 0)::text AS "recentSales",
              COALESCE(SUM(total) FILTER (WHERE sale_date < CURRENT_DATE - INTERVAL '30 days' AND sale_date >= CURRENT_DATE - INTERVAL '60 days' AND status <> 'anulada'), 0)::text AS "previousSales",
              COUNT(*) FILTER (WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days' AND status <> 'anulada')::text AS "recentOrders"
       FROM sales_orders
       WHERE company_id = $1`,
      [companyId]
    ),
    query<{ productName: string; quantity: string; sales: string }>(
      `SELECT sales_products.name AS "productName",
              COALESCE(SUM(sales_order_items.quantity), 0)::text AS quantity,
              COALESCE(SUM(sales_order_items.total), 0)::text AS sales
       FROM sales_products
       LEFT JOIN sales_order_items ON sales_order_items.product_id = sales_products.id
       LEFT JOIN sales_orders ON sales_orders.id = sales_order_items.order_id
         AND sales_orders.status <> 'anulada'
         AND sales_orders.sale_date >= CURRENT_DATE - INTERVAL '30 days'
       WHERE sales_products.company_id = $1
         AND sales_products.status = 'active'
       GROUP BY sales_products.id, sales_products.name
       ORDER BY COALESCE(SUM(sales_order_items.quantity), 0) ASC, sales_products.name ASC
       LIMIT 1`,
      [companyId]
    ),
    query<{ customerName: string; orders: string; sales: string }>(
      `SELECT COALESCE(sales_customers.name, 'Cliente sin nombre') AS "customerName",
              COUNT(*)::text AS orders,
              COALESCE(SUM(sales_orders.total), 0)::text AS sales
       FROM sales_orders
       LEFT JOIN sales_customers ON sales_customers.id = sales_orders.customer_id
       WHERE sales_orders.company_id = $1
         AND sales_orders.status <> 'anulada'
         AND sales_orders.sale_date >= CURRENT_DATE - INTERVAL '60 days'
       GROUP BY COALESCE(sales_customers.name, 'Cliente sin nombre')
       ORDER BY COUNT(*) DESC, SUM(sales_orders.total) DESC
       LIMIT 1`,
      [companyId]
    ),
    query<{ channelName: string; sales: string; orders: string; avgSales: string }>(
      `WITH channel_sales AS (
         SELECT COALESCE(sales_channels.name, 'Canal no definido') AS channel_name,
                COALESCE(SUM(sales_orders.total), 0) AS sales,
                COUNT(*) AS orders
         FROM sales_orders
         LEFT JOIN sales_channels ON sales_channels.id = sales_orders.channel_id
         WHERE sales_orders.company_id = $1
           AND sales_orders.status <> 'anulada'
           AND sales_orders.sale_date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY COALESCE(sales_channels.name, 'Canal no definido')
       )
       SELECT channel_name AS "channelName",
              sales::text,
              orders::text,
              COALESCE((SELECT AVG(sales) FROM channel_sales), 0)::text AS "avgSales"
       FROM channel_sales
       ORDER BY sales ASC
       LIMIT 1`,
      [companyId]
    ),
    query<{ discountTotal: string; subtotal: string; affectedOrders: string }>(
      `SELECT COALESCE(SUM(discount_total), 0)::text AS "discountTotal",
              COALESCE(SUM(subtotal), 0)::text AS subtotal,
              COUNT(*) FILTER (WHERE subtotal > 0 AND discount_total / subtotal >= 0.15)::text AS "affectedOrders"
       FROM sales_orders
       WHERE company_id = $1
         AND status <> 'anulada'
         AND sale_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [companyId]
    ),
    query<{ pendingTotal: string; pendingOrders: string }>(
      `SELECT COALESCE(SUM(total), 0)::text AS "pendingTotal",
              COUNT(*)::text AS "pendingOrders"
       FROM sales_orders
       WHERE company_id = $1
         AND status = 'pendiente'`,
      [companyId]
    ),
    query<{ dayName: string; sales: string; orders: string }>(
      `SELECT CASE EXTRACT(DOW FROM sale_date)
                WHEN 0 THEN 'domingo'
                WHEN 1 THEN 'lunes'
                WHEN 2 THEN 'martes'
                WHEN 3 THEN 'miércoles'
                WHEN 4 THEN 'jueves'
                WHEN 5 THEN 'viernes'
                ELSE 'sábado'
              END AS "dayName",
              COALESCE(SUM(total), 0)::text AS sales,
              COUNT(*)::text AS orders
       FROM sales_orders
       WHERE company_id = $1
         AND status <> 'anulada'
         AND sale_date >= CURRENT_DATE - INTERVAL '60 days'
       GROUP BY EXTRACT(DOW FROM sale_date)
       ORDER BY SUM(total) DESC
       LIMIT 1`,
      [companyId]
    ),
    query<{ productName: string; sales: string; orders: string }>(
      `SELECT sales_order_items.description AS "productName",
              COALESCE(SUM(sales_order_items.total), 0)::text AS sales,
              COUNT(*)::text AS orders
       FROM sales_order_items
       JOIN sales_orders ON sales_orders.id = sales_order_items.order_id
       WHERE sales_orders.company_id = $1
         AND sales_orders.status <> 'anulada'
         AND sales_orders.sale_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY sales_order_items.description
       ORDER BY SUM(sales_order_items.total) DESC
      LIMIT 1`,
      [companyId]
    ),
    query<{ productName: string; currentSales: string; previousSales: string }>(
      `WITH product_periods AS (
         SELECT sales_order_items.description AS product_name,
                COALESCE(SUM(sales_order_items.total) FILTER (WHERE sales_orders.sale_date >= CURRENT_DATE - INTERVAL '7 days'), 0) AS current_sales,
                COALESCE(SUM(sales_order_items.total) FILTER (
                  WHERE sales_orders.sale_date < CURRENT_DATE - INTERVAL '7 days'
                    AND sales_orders.sale_date >= CURRENT_DATE - INTERVAL '14 days'
                ), 0) AS previous_sales
         FROM sales_order_items
         JOIN sales_orders ON sales_orders.id = sales_order_items.order_id
         WHERE sales_orders.company_id = $1
           AND sales_orders.status <> 'anulada'
           AND sales_orders.sale_date >= CURRENT_DATE - INTERVAL '14 days'
         GROUP BY sales_order_items.description
       )
       SELECT product_name AS "productName",
              current_sales::text AS "currentSales",
              previous_sales::text AS "previousSales"
       FROM product_periods
       WHERE previous_sales > 0
         AND current_sales < previous_sales * 0.9
       ORDER BY ((previous_sales - current_sales) / previous_sales) DESC
       LIMIT 1`,
      [companyId]
    ),
    query<{ topChannel: string; topSales: string; physicalChannel: string; physicalSales: string }>(
      `WITH channel_sales AS (
         SELECT COALESCE(sales_channels.name, 'Canal no definido') AS channel_name,
                COALESCE(SUM(sales_orders.total), 0) AS sales
         FROM sales_orders
         LEFT JOIN sales_channels ON sales_channels.id = sales_orders.channel_id
         WHERE sales_orders.company_id = $1
           AND sales_orders.status <> 'anulada'
           AND sales_orders.sale_date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY COALESCE(sales_channels.name, 'Canal no definido')
       ),
       top_channel AS (
         SELECT channel_name, sales
         FROM channel_sales
         ORDER BY sales DESC
         LIMIT 1
       ),
       physical_channel AS (
         SELECT channel_name, sales
         FROM channel_sales
         WHERE lower(channel_name) SIMILAR TO '%(tienda|fisica|física|mostrador|local)%'
         ORDER BY sales DESC
         LIMIT 1
       )
       SELECT COALESCE((SELECT channel_name FROM top_channel), '') AS "topChannel",
              COALESCE((SELECT sales FROM top_channel), 0)::text AS "topSales",
              COALESCE((SELECT channel_name FROM physical_channel), 'tienda física') AS "physicalChannel",
              COALESCE((SELECT sales FROM physical_channel), 0)::text AS "physicalSales"`,
      [companyId]
    ),
    query<{ productName: string; sales: string; stock: string }>(
      `SELECT sales_products.name AS "productName",
              COALESCE(SUM(sales_order_items.total), 0)::text AS sales,
              COALESCE(MAX(sales_products.stock), 0)::text AS stock
       FROM sales_order_items
       JOIN sales_orders ON sales_orders.id = sales_order_items.order_id
       LEFT JOIN sales_products ON sales_products.id = sales_order_items.product_id
       WHERE sales_orders.company_id = $1
         AND sales_orders.status <> 'anulada'
         AND sales_orders.sale_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY sales_products.id, sales_products.name
       ORDER BY SUM(sales_order_items.total) DESC
       LIMIT 1`,
      [companyId]
    ),
    query<{ customerName: string; lastPurchase: string; sales: string }>(
      `WITH customer_last_purchase AS (
         SELECT sales_customers.name AS customer_name,
                MAX(sales_orders.sale_date) AS last_purchase,
                COALESCE(SUM(sales_orders.total), 0) AS sales
         FROM sales_customers
         JOIN sales_orders ON sales_orders.customer_id = sales_customers.id
         WHERE sales_customers.company_id = $1
           AND sales_orders.status <> 'anulada'
         GROUP BY sales_customers.id, sales_customers.name
       )
       SELECT customer_name AS "customerName",
              last_purchase::text AS "lastPurchase",
              sales::text
       FROM customer_last_purchase
       WHERE last_purchase < CURRENT_DATE - INTERVAL '30 days'
       ORDER BY sales DESC
       LIMIT 1`,
      [companyId]
    )
  ]);

  const trendRow = trend.rows[0];
  const recentSales = Number(trendRow?.recentSales || 0);
  const previousSales = Number(trendRow?.previousSales || 0);
  const recentOrders = Number(trendRow?.recentOrders || 0);
  if (!recentOrders) return;

  const suggestions: Parameters<typeof upsertSalesAnalysisSuggestion>[1][] = [];
  const dropPercent = previousSales > 0 ? ((previousSales - recentSales) / previousSales) * 100 : 0;
  if (dropPercent >= 8) {
    suggestions.push({
      analysisKey: "sales_drop",
      category: "ventas",
      priority: dropPercent >= 18 ? "critical" : "high",
      title: "Caída de ventas detectada",
      description: `Las ventas de los últimos 30 días cayeron ${percent(dropPercent)} frente al periodo anterior.`,
      recommendation: "Revisa productos líderes, canales con baja respuesta y activa una promoción corta para recuperar ritmo esta semana.",
      impactType: "ventas_adicionales",
      impactLabel: moneyLabel((previousSales - recentSales) * 0.35, "recuperables"),
      impactValueCop: Math.round((previousSales - recentSales) * 0.35),
      confidence: 88,
      evidence: { recentSales, previousSales, dropPercent }
    });
  }

  const weeklyDropRow = weeklyProductDrop.rows[0];
  const currentProductSales = Number(weeklyDropRow?.currentSales || 0);
  const previousProductSales = Number(weeklyDropRow?.previousSales || 0);
  const productDropPercent = previousProductSales > 0 ? ((previousProductSales - currentProductSales) / previousProductSales) * 100 : 0;
  if (weeklyDropRow?.productName && productDropPercent >= 10) {
    suggestions.push({
      analysisKey: "weekly_product_drop",
      category: "ventas",
      priority: productDropPercent >= 18 ? "high" : "medium",
      title: "Producto bajó esta semana",
      description: `${weeklyDropRow.productName} bajó ${percent(productDropPercent)} esta semana frente a la semana anterior.`,
      recommendation: "Revisa precio, disponibilidad, exhibición y canal principal. Si el producto sigue siendo rentable, activa recordatorio o promoción puntual.",
      impactType: "ventas_adicionales",
      impactLabel: moneyLabel((previousProductSales - currentProductSales) * 0.45, "recuperables"),
      impactValueCop: Math.round((previousProductSales - currentProductSales) * 0.45),
      confidence: 84,
      evidence: { ...weeklyDropRow, productDropPercent }
    });
  }

  const lowRotationRow = lowRotation.rows[0];
  if (lowRotationRow?.productName && Number(lowRotationRow.quantity || 0) <= 2) {
    suggestions.push({
      analysisKey: "low_rotation_product",
      category: "inventario",
      priority: "medium",
      title: "Producto con baja rotación",
      description: `${lowRotationRow.productName} casi no se movió en los últimos 30 días.`,
      recommendation: "No repongas más unidades todavía. Prueba paquete promocional o cambia exhibición antes de comprar inventario.",
      impactType: "riesgo_evitado",
      impactLabel: moneyLabel(Math.max(Number(lowRotationRow.sales || 0), recentSales * 0.02), "en inventario protegido"),
      impactValueCop: Math.round(Math.max(Number(lowRotationRow.sales || 0), recentSales * 0.02)),
      confidence: 74,
      evidence: lowRotationRow
    });
  }

  const customerRow = frequentCustomer.rows[0];
  if (customerRow?.customerName && Number(customerRow.orders || 0) >= 2) {
    suggestions.push({
      analysisKey: "frequent_customer",
      category: "clientes",
      priority: "medium",
      title: "Cliente frecuente para fidelizar",
      description: `${customerRow.customerName} es uno de los clientes con más compras recientes.`,
      recommendation: "Crea una oferta personalizada o recordatorio de recompra para aumentar ticket sin depender de descuentos generales.",
      impactType: "ventas_adicionales",
      impactLabel: moneyLabel(Number(customerRow.sales || 0) * 0.12, "potenciales"),
      impactValueCop: Math.round(Number(customerRow.sales || 0) * 0.12),
      confidence: 82,
      evidence: customerRow
    });
  }

  const weakChannelRow = weakChannel.rows[0];
  const weakChannelSales = Number(weakChannelRow?.sales || 0);
  const avgChannelSales = Number(weakChannelRow?.avgSales || 0);
  if (weakChannelRow?.channelName && avgChannelSales > 0 && weakChannelSales < avgChannelSales * 0.65) {
    suggestions.push({
      analysisKey: "weak_channel",
      category: "ventas",
      priority: "medium",
      title: "Canal de venta débil",
      description: `${weakChannelRow.channelName} vende por debajo del promedio de tus canales.`,
      recommendation: "Revisa mensajes, tiempos de respuesta y oferta por canal. Si no mejora, mueve esfuerzo al canal más rentable.",
      impactType: "ventas_adicionales",
      impactLabel: moneyLabel((avgChannelSales - weakChannelSales) * 0.4, "de oportunidad"),
      impactValueCop: Math.round((avgChannelSales - weakChannelSales) * 0.4),
      confidence: 78,
      evidence: { ...weakChannelRow, avgChannelSales }
    });
  }

  const channelComparisonRow = channelComparison.rows[0];
  const topSales = Number(channelComparisonRow?.topSales || 0);
  const physicalSales = Number(channelComparisonRow?.physicalSales || 0);
  if (channelComparisonRow?.topChannel && topSales > 0 && channelComparisonRow.topChannel !== channelComparisonRow.physicalChannel && topSales > physicalSales * 1.15) {
    suggestions.push({
      analysisKey: "channel_outperforms_physical",
      category: "ventas",
      priority: "medium",
      title: `${channelComparisonRow.topChannel} supera a ${channelComparisonRow.physicalChannel}`,
      description: `El canal ${channelComparisonRow.topChannel} vende más que ${channelComparisonRow.physicalChannel} en los últimos 30 días.`,
      recommendation: `Refuerza inventario, atención y campañas en ${channelComparisonRow.topChannel}. Mantén ${channelComparisonRow.physicalChannel} como apoyo, pero asigna más esfuerzo al canal ganador.`,
      impactType: "ventas_adicionales",
      impactLabel: moneyLabel((topSales - physicalSales) * 0.2, "de oportunidad por canal"),
      impactValueCop: Math.round((topSales - physicalSales) * 0.2),
      confidence: 79,
      evidence: channelComparisonRow
    });
  }

  const discountRow = discounts.rows[0];
  const subtotal = Number(discountRow?.subtotal || 0);
  const discountTotal = Number(discountRow?.discountTotal || 0);
  const discountRate = subtotal > 0 ? (discountTotal / subtotal) * 100 : 0;
  if (discountRate >= 10 || Number(discountRow?.affectedOrders || 0) > 0) {
    suggestions.push({
      analysisKey: "excessive_discounts",
      category: "precios",
      priority: discountRate >= 18 ? "high" : "medium",
      title: "Descuentos altos reducen margen",
      description: `Los descuentos representan ${percent(discountRate)} de las ventas recientes.`,
      recommendation: "Define máximo de descuento por canal y reemplaza rebajas abiertas por combos o beneficios por recompra.",
      impactType: "margen",
      impactLabel: moneyLabel(discountTotal * 0.35, "recuperables en margen"),
      impactValueCop: Math.round(discountTotal * 0.35),
      confidence: 86,
      evidence: { subtotal, discountTotal, discountRate, affectedOrders: Number(discountRow?.affectedOrders || 0) }
    });
  }

  const pendingRow = pending.rows[0];
  const pendingTotal = Number(pendingRow?.pendingTotal || 0);
  if (pendingTotal > 0) {
    suggestions.push({
      analysisKey: "pending_sales",
      category: "caja",
      priority: pendingTotal > recentSales * 0.2 ? "high" : "medium",
      title: "Ventas pendientes por cobrar",
      description: `Hay ${moneyLabel(pendingTotal, "pendientes por cobrar")} en ventas abiertas.`,
      recommendation: "Prioriza cobro hoy, separa clientes por vencimiento y evita entregar nuevos pedidos sin acuerdo de pago.",
      impactType: "ahorro",
      impactLabel: moneyLabel(pendingTotal * 0.25, "de caja recuperable"),
      impactValueCop: Math.round(pendingTotal * 0.25),
      confidence: 90,
      evidence: pendingRow
    });
  }

  const topProductStockRow = topProductStock.rows[0];
  if (topProductStockRow?.productName && Number(topProductStockRow.sales || 0) > 0) {
    const stock = Number(topProductStockRow.stock || 0);
    suggestions.push({
      analysisKey: "increase_top_product_inventory",
      category: "inventario",
      priority: stock <= 5 ? "high" : "medium",
      title: "Sube inventario del producto más vendido",
      description: `${topProductStockRow.productName} es el producto más vendido del mes y tiene ${stock} unidades registradas.`,
      recommendation: "Asegura reposición antes de impulsar campañas. Si el proveedor tarda, compra cobertura mínima para no perder ventas.",
      impactType: "riesgo_evitado",
      impactLabel: moneyLabel(Number(topProductStockRow.sales || 0) * 0.18, "en ventas protegidas"),
      impactValueCop: Math.round(Number(topProductStockRow.sales || 0) * 0.18),
      confidence: 83,
      evidence: topProductStockRow
    });
  }

  const inactiveCustomerRow = inactiveCustomer.rows[0];
  if (inactiveCustomerRow?.customerName) {
    suggestions.push({
      analysisKey: "contact_inactive_customer",
      category: "clientes",
      priority: "medium",
      title: "Contacta clientes sin compra reciente",
      description: `${inactiveCustomerRow.customerName} no compra hace más de 30 días.`,
      recommendation: "Envía mensaje de recompra con una oferta simple o producto recomendado según su historial.",
      impactType: "ventas_adicionales",
      impactLabel: moneyLabel(Number(inactiveCustomerRow.sales || 0) * 0.08, "potenciales por reactivación"),
      impactValueCop: Math.round(Number(inactiveCustomerRow.sales || 0) * 0.08),
      confidence: 77,
      evidence: inactiveCustomerRow
    });
  }

  const strongDayRow = strongDay.rows[0];
  if (strongDayRow?.dayName && Number(strongDayRow.sales || 0) > 0) {
    suggestions.push({
      analysisKey: "strong_day",
      category: "ventas",
      priority: "low",
      title: "Día fuerte de ventas",
      description: `El ${strongDayRow.dayName} concentra el mejor desempeño comercial reciente.`,
      recommendation: `Programa campañas, inventario y personal de apoyo para el ${strongDayRow.dayName}; ahí tienes mayor probabilidad de conversión.`,
      impactType: "ventas_adicionales",
      impactLabel: moneyLabel(Number(strongDayRow.sales || 0) * 0.08, "por empujar día fuerte"),
      impactValueCop: Math.round(Number(strongDayRow.sales || 0) * 0.08),
      confidence: 76,
      evidence: strongDayRow
    });
  }

  const promoRow = promo.rows[0];
  if (promoRow?.productName && Number(promoRow.sales || 0) > 0) {
    suggestions.push({
      analysisKey: "promotion_opportunity",
      category: "ventas",
      priority: "medium",
      title: "Oportunidad de promoción",
      description: `${promoRow.productName} ya tiene tracción y puede atraer más ventas si se usa como gancho comercial.`,
      recommendation: "Crea promoción por tiempo limitado, combo o venta cruzada alrededor de este producto para subir ticket promedio.",
      impactType: "ventas_adicionales",
      impactLabel: moneyLabel(Number(promoRow.sales || 0) * 0.1, "adicionales estimados"),
      impactValueCop: Math.round(Number(promoRow.sales || 0) * 0.1),
      confidence: 80,
      evidence: promoRow
    });
  }

  await Promise.all(suggestions.map((suggestion) => upsertSalesAnalysisSuggestion(companyId, suggestion)));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;

    await generateSalesAnalysisSuggestions(companyId);
    let suggestions = await getSuggestions(companyId);
    if (!suggestions.rows.length) {
      await seedDefaultSuggestions(companyId);
    }
    await refreshSuggestionImpacts(companyId);
    suggestions = await getSuggestions(companyId);

    return ok({ suggestions: suggestions.rows });
  } catch (error) {
    return fail(error, 400);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;

    const title = requiredString(body.title, "title");
    const description = requiredString(body.description, "description");
    const recommendation = requiredString(body.recommendation, "recommendation");
    const category = body.category || "general";
    const priority = body.priority || "medium";
    const impact = await calculateSuggestionImpact(companyId, category, priority);

    const suggestion = await query(
      `INSERT INTO ai_suggestions (
         company_id,
         category,
         priority,
         title,
         description,
         recommendation,
         impact_type,
         impact_label,
         impact_value_cop,
         confidence,
         status,
         evidence,
         metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb)
       RETURNING *`,
      [
        companyId,
        category,
        priority,
        title,
        description,
        recommendation,
        body.impactType || impact.impactType,
        body.impactLabel || impact.impactLabel,
        body.impactValueCop || impact.impactValueCop,
        body.confidence || 0,
        body.status || "nueva",
        JSON.stringify({ ...(body.evidence || {}), impact: impact.evidence }),
        JSON.stringify(body.metadata || {})
      ]
    );

    return ok({ suggestion: suggestion.rows[0] }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
