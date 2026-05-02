export function createCard({ title, body, meta, accent = "blue" } = {}) {
  const card = document.createElement("article");
  card.className = `brand-card brand-card-${accent}`;
  card.innerHTML = `
    ${meta ? `<span class="brand-card-meta">${meta}</span>` : ""}
    <h3>${title || "Card title"}</h3>
    <p>${body || "Card body content for Copiloto Pyme."}</p>
  `;
  return card;
}

export function mountCards(root = document) {
  root.querySelectorAll("[data-brand-card]").forEach((target) => {
    const card = createCard({
      title: target.dataset.title,
      body: target.dataset.body,
      meta: target.dataset.meta,
      accent: target.dataset.accent || "blue",
    });
    target.replaceWith(card);
  });
}

if (typeof window !== "undefined") {
  window.CopilotoCard = { createCard, mountCards };
}
