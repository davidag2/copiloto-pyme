import { LegalPage, type LegalSection } from "@/components/marketing/LegalPage";
import { legalVersions } from "@/lib/legal";

const sections: LegalSection[] = [
  {
    title: "1. Qué son las cookies",
    body: [
      "Las cookies y tecnologías similares son pequeños archivos o identificadores que permiten recordar información del navegador, mejorar la experiencia, mantener sesiones y entender el uso del sitio.",
      "Copiloto Pyme puede usar cookies propias y de terceros para operar el sitio, proteger cuentas, recordar preferencias y medir rendimiento."
    ]
  },
  {
    title: "2. Tipos de cookies",
    body: [
      "Cookies técnicas: necesarias para navegación, autenticación, seguridad, formularios, sesiones y funcionamiento básico de la plataforma.",
      "Cookies de preferencias: permiten recordar configuraciones como idioma, modo claro u oscuro y opciones de interfaz.",
      "Cookies analíticas: ayudan a entender tráfico, errores, rendimiento y uso general del sitio para mejorar el producto.",
      "Cookies comerciales: podrán utilizarse en el futuro para medir campañas, conversiones o comunicaciones, siempre conforme a la normativa aplicable."
    ]
  },
  {
    title: "3. Herramientas de terceros",
    body: [
      "Algunos proveedores de infraestructura, analítica, comunicación, pagos, soporte o seguridad pueden usar cookies o identificadores técnicos necesarios para prestar sus servicios.",
      "El uso de estas tecnologías se rige también por las políticas de los respectivos proveedores."
    ]
  },
  {
    title: "4. Gestión de cookies",
    body: [
      "El usuario puede configurar su navegador para bloquear, eliminar o limitar cookies. Algunas funciones de Copiloto Pyme podrían dejar de operar correctamente si se desactivan cookies esenciales.",
      "Cuando implementemos un centro de preferencias, el usuario podrá gestionar categorías no esenciales desde el sitio."
    ]
  },
  {
    title: "5. Cambios",
    body: [
      "Tecnotitan S.A.S. podrá actualizar esta política para reflejar cambios técnicos, legales o de producto.",
      "La versión vigente estará disponible en esta página y podrá enlazarse desde el registro, footer y flujos de aceptación."
    ]
  }
];

export default function CookiesPage() {
  return (
    <LegalPage
      badge="Cookies"
      description="Información sobre el uso de cookies y tecnologías similares en el sitio y plataforma de Copiloto Pyme."
      effectiveDate={legalVersions.cookies.effectiveDate}
      sections={sections}
      title="Política de Cookies"
    />
  );
}
