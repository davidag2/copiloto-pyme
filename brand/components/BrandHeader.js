export function createBrandHeader({
  title = "Copiloto Pyme",
  subtitle = "Decisiones claras para PYMES en tiempo real",
  cta = "Ver demo",
} = {}) {
  const header = document.createElement("header");
  header.className = "brand-header";
  header.innerHTML = `
    <a class="brand-header-logo" href="../brand/brand-preview.html" aria-label="${title}">
      <img src="./assets/logo-horizontal.svg" alt="${title}" width="220" height="60">
    </a>
    <nav class="brand-header-nav" aria-label="Navegacion de marca">
      <a href="#logos">Logos</a>
      <a href="#colors">Colores</a>
      <a href="#components">Componentes</a>
      <a class="btn btn-primary" href="#preview">${cta}</a>
    </nav>
    <div class="brand-header-copy">
      <span class="eyebrow">Sistema visual</span>
      <h1>${title}</h1>
      <p class="text-lead">${subtitle}</p>
    </div>
  `;
  return header;
}

export function mountBrandHeaders(root = document) {
  root.querySelectorAll("[data-brand-header]").forEach((target) => {
    const header = createBrandHeader({
      title: target.dataset.title,
      subtitle: target.dataset.subtitle,
      cta: target.dataset.cta,
    });
    target.replaceWith(header);
  });
}

if (typeof window !== "undefined") {
  window.CopilotoBrandHeader = { createBrandHeader, mountBrandHeaders };
}
