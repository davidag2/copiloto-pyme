import { LegalPage, type LegalSection } from "@/components/marketing/LegalPage";
import { legalVersions } from "@/lib/legal";

const sections: LegalSection[] = [
  {
    title: "1. Responsable del tratamiento",
    body: [
      "Tecnotitan S.A.S. es responsable de Copiloto Pyme y del tratamiento de los datos personales recolectados a través del sitio web, formularios, registro, prueba gratuita, dashboard, soporte y comunicaciones comerciales.",
      "El canal principal para consultas relacionadas con privacidad es hola@copilotopyme.com."
    ]
  },
  {
    title: "2. Información que podemos recolectar",
    body: [
      "Podemos recolectar nombre, email, teléfono, empresa, país, cargo, información de facturación, datos de uso, datos técnicos del navegador, dirección IP y mensajes enviados por formularios o chat.",
      "Cuando el cliente usa la plataforma, también puede cargar información operativa de su empresa, como ventas, caja, inventario, clientes, reportes, importaciones y datos necesarios para generar recomendaciones."
    ]
  },
  {
    title: "3. Finalidades",
    body: [
      "Usamos la información para crear y administrar cuentas, activar pruebas gratuitas, prestar el servicio, generar decisiones con IA, procesar pagos, emitir facturas, atender soporte, mejorar la plataforma y enviar comunicaciones relacionadas con el producto.",
      "También podemos usar datos agregados o anonimizados para analizar rendimiento, estabilidad, seguridad y adopción del producto."
    ]
  },
  {
    title: "4. Proveedores y encargados",
    body: [
      "Copiloto Pyme puede apoyarse en proveedores tecnológicos como Vercel, Supabase/PostgreSQL, Resend, OpenAI, pasarelas de pago, SIIGO y herramientas de monitoreo o comunicación.",
      "Estos proveedores solo deben tratar la información conforme a las instrucciones necesarias para prestar el servicio."
    ]
  },
  {
    title: "5. Seguridad",
    body: [
      "Aplicamos medidas razonables de seguridad técnica, administrativa y operativa para proteger la información contra acceso no autorizado, pérdida, alteración o uso indebido.",
      "Ninguna plataforma es completamente inmune a riesgos, por lo que mantenemos monitoreo, controles de acceso, logs y procesos de respuesta ante incidentes."
    ]
  },
  {
    title: "6. Derechos del titular",
    body: [
      "Los titulares pueden solicitar acceso, actualización, corrección, eliminación, revocatoria de autorización o información sobre el uso de sus datos, conforme a la ley aplicable.",
      "Las solicitudes se pueden enviar a hola@copilotopyme.com indicando nombre, email, empresa y descripción clara de la solicitud."
    ]
  },
  {
    title: "7. Conservación",
    body: [
      "Conservamos los datos durante el tiempo necesario para prestar el servicio, cumplir obligaciones legales, atender soporte, conservar auditoría y proteger derechos de Tecnotitan S.A.S., clientes y usuarios.",
      "Cuando una cuenta se cierre, algunos datos podrán conservarse por obligaciones contables, legales, fiscales, antifraude o de seguridad."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <LegalPage
      badge="Privacidad"
      description="Conoce cómo Copiloto Pyme recolecta, usa, protege y conserva la información personal y operativa de sus usuarios."
      effectiveDate={legalVersions.privacy.effectiveDate}
      sections={sections}
      title="Política de Privacidad"
    />
  );
}
