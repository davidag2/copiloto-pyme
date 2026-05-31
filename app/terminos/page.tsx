import { LegalPage, type LegalSection } from "@/components/marketing/LegalPage";
import { legalVersions } from "@/lib/legal";

const sections: LegalSection[] = [
  {
    title: "1. Aceptación de los términos",
    body: [
      "Al crear una cuenta, iniciar una prueba gratuita, acceder al dashboard o usar Copiloto Pyme, el usuario declara que conoce y acepta estos Términos y Condiciones.",
      "Si el usuario actúa en nombre de una empresa, declara que tiene autorización suficiente para aceptar estos términos y administrar la cuenta principal."
    ]
  },
  {
    title: "2. Descripción del servicio",
    body: [
      "Copiloto Pyme es una plataforma SaaS para administrar información de ventas, caja, inventario, clientes, equipo, datos, reportes, alertas, configuración y proyecciones según el plan contratado.",
      "La plataforma utiliza inteligencia artificial para analizar información cargada por el cliente y sugerir riesgos, oportunidades, decisiones y acciones operativas."
    ]
  },
  {
    title: "3. Prueba gratuita",
    body: [
      "Los planes pueden incluir una prueba gratuita de 30 días. Durante este periodo, el cliente puede explorar las funcionalidades disponibles según el plan elegido.",
      "Al finalizar la prueba, si no existe pago válido o suscripción activa, Tecnotitan S.A.S. podrá restringir o bloquear el acceso al dashboard hasta regularizar el estado de pago."
    ]
  },
  {
    title: "4. Planes, pagos y cancelación",
    body: [
      "Los precios se muestran en pesos colombianos y pueden no incluir impuestos aplicables, salvo que se indique expresamente lo contrario.",
      "El cliente puede cambiar, cancelar o ajustar su plan conforme a las opciones disponibles en la plataforma y a las políticas comerciales vigentes."
    ]
  },
  {
    title: "5. Responsabilidades del usuario",
    body: [
      "El usuario debe suministrar información verdadera, mantener la confidencialidad de sus credenciales, controlar los permisos de su equipo y usar la plataforma de forma lícita.",
      "El usuario es responsable por la calidad, exactitud y legalidad de los datos que cargue, importe o registre en Copiloto Pyme."
    ]
  },
  {
    title: "6. Alcance de las recomendaciones de IA",
    body: [
      "Las sugerencias generadas por IA son una herramienta de apoyo para la toma de decisiones y no sustituyen el criterio profesional, contable, financiero, legal o administrativo del cliente.",
      "El cliente conserva la responsabilidad final sobre las decisiones que adopte con base en la información o recomendaciones mostradas por la plataforma."
    ]
  },
  {
    title: "7. Propiedad intelectual",
    body: [
      "Copiloto Pyme, su marca, diseño, software, textos, interfaces, flujos, componentes y documentación pertenecen a Tecnotitan S.A.S. o a sus licenciantes.",
      "El cliente conserva la propiedad de los datos de su empresa, sin perjuicio de las autorizaciones necesarias para operar, procesar y mejorar el servicio."
    ]
  },
  {
    title: "8. Suspensión o terminación",
    body: [
      "Tecnotitan S.A.S. podrá suspender cuentas por falta de pago, uso indebido, riesgos de seguridad, violación de estos términos, fraude o requerimiento legal.",
      "La terminación del servicio no elimina automáticamente obligaciones pendientes de pago, conservación legal de información o registros de auditoría."
    ]
  }
];

export default function TermsPage() {
  return (
    <LegalPage
      badge="Términos"
      description="Reglas de uso de Copiloto Pyme, prueba gratuita, planes, pagos, responsabilidades y alcance de las recomendaciones con IA."
      effectiveDate={legalVersions.terms.effectiveDate}
      sections={sections}
      title="Términos y Condiciones"
    />
  );
}
