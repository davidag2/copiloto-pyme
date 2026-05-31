import { LegalPage, type LegalSection } from "@/components/marketing/LegalPage";
import { legalVersions } from "@/lib/legal";

const sections: LegalSection[] = [
  {
    title: "1. Responsable",
    body: [
      "Tecnotitan S.A.S. actúa como responsable del tratamiento de datos personales recolectados mediante Copiloto Pyme, sus formularios, canales de soporte, procesos de registro, facturación y uso de la plataforma.",
      "El correo de contacto para consultas, reclamos, solicitudes y notificaciones legales relacionadas con datos personales es info@tecnotitan.com."
    ]
  },
  {
    title: "2. Autorización",
    body: [
      "Al registrarse, solicitar una demo, iniciar una prueba gratuita, usar el chatbot o enviar información a través del sitio, el titular autoriza el tratamiento de sus datos personales conforme a esta política.",
      "La autorización debe ser previa, expresa e informada, especialmente cuando se creen cuentas, usuarios, empresas, tickets de soporte, procesos de pago o registros de facturación."
    ]
  },
  {
    title: "3. Datos tratados",
    body: [
      "Podemos tratar datos de identificación, contacto, empresa, cargo, país, facturación, soporte, navegación, IP, actividad en la plataforma, registros de auditoría y comunicaciones.",
      "También podemos procesar información empresarial cargada por el cliente para operar módulos como ventas, caja, inventario, clientes, reportes, alertas y proyecciones."
    ]
  },
  {
    title: "4. Finalidades del tratamiento",
    body: [
      "Administrar cuentas, activar pruebas gratuitas, prestar servicios SaaS, autenticar usuarios, gestionar permisos, procesar pagos, emitir facturas, atender soporte y mejorar la experiencia del producto.",
      "Analizar datos operativos para generar alertas, sugerencias, reportes, decisiones asistidas por IA, proyecciones y métricas de negocio."
    ]
  },
  {
    title: "5. Derechos de los titulares",
    body: [
      "El titular puede conocer, actualizar, rectificar, solicitar prueba de autorización, ser informado sobre el uso de sus datos, presentar quejas, revocar autorizaciones y solicitar supresión cuando sea procedente.",
      "Las solicitudes serán atendidas por los canales definidos por Tecnotitan S.A.S. y conforme a los plazos previstos por la normativa aplicable."
    ]
  },
  {
    title: "6. Procedimiento para consultas y reclamos",
    body: [
      "La solicitud debe indicar nombre, documento si aplica, email, empresa, descripción clara de la petición y medio de respuesta.",
      "Tecnotitan S.A.S. podrá pedir información adicional para verificar identidad, titularidad o autorización antes de ejecutar cambios, entregar información o eliminar datos."
    ]
  },
  {
    title: "7. Transferencias y transmisiones",
    body: [
      "Los datos pueden ser transmitidos a proveedores tecnológicos necesarios para operar la plataforma, como infraestructura, base de datos, correo, inteligencia artificial, pagos, facturación y monitoreo.",
      "Cuando se usen proveedores ubicados fuera del país del titular, Tecnotitan S.A.S. procurará aplicar medidas contractuales y técnicas razonables para proteger la información."
    ]
  }
];

export default function DataTreatmentPage() {
  return (
    <LegalPage
      badge="Datos personales"
      description="Política base para el tratamiento de datos personales de clientes, usuarios, visitantes y contactos de Copiloto Pyme."
      effectiveDate={legalVersions.dataProcessing.effectiveDate}
      sections={sections}
      title="Política de Tratamiento de Datos Personales"
    />
  );
}
