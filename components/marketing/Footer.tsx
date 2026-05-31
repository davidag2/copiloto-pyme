import { legalDocumentsList } from "@/lib/legal";

export function Footer() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-footer-brand">
        <span>Copiloto Pyme</span>
        <strong>Un producto Tecnotitan S.A.S</strong>
      </div>
      <nav className="mkt-footer-legal" aria-label="Enlaces legales">
        {legalDocumentsList.map((document) => (
          <a href={document.path} key={document.id}>{document.label}</a>
        ))}
      </nav>
    </footer>
  );
}
