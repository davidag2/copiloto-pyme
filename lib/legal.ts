export type LegalDocumentId = "terms" | "privacy" | "dataProcessing" | "cookies";

export type LegalDocumentVersion = {
  id: LegalDocumentId;
  label: string;
  path: string;
  version: string;
  effectiveDate: string;
};

export const legalVersions = {
  terms: {
    id: "terms",
    label: "Términos y Condiciones",
    path: "/terminos",
    version: "2026-05-30",
    effectiveDate: "30 de mayo de 2026"
  },
  privacy: {
    id: "privacy",
    label: "Política de Privacidad",
    path: "/privacidad",
    version: "2026-05-30",
    effectiveDate: "30 de mayo de 2026"
  },
  dataProcessing: {
    id: "dataProcessing",
    label: "Tratamiento de Datos Personales",
    path: "/tratamiento-datos",
    version: "2026-05-30",
    effectiveDate: "30 de mayo de 2026"
  },
  cookies: {
    id: "cookies",
    label: "Política de Cookies",
    path: "/cookies",
    version: "2026-05-30",
    effectiveDate: "30 de mayo de 2026"
  }
} satisfies Record<LegalDocumentId, LegalDocumentVersion>;

export const currentLegalAcceptance = {
  version: "2026-05-30",
  documents: legalVersions
};

export const legalDocumentsList = [
  legalVersions.privacy,
  legalVersions.terms,
  legalVersions.dataProcessing,
  legalVersions.cookies
];
