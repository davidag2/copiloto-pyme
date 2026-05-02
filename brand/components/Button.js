export function createButton({ label, variant = "primary", disabled = false, type = "button" } = {}) {
  const button = document.createElement("button");
  button.className = `btn btn-${variant}`;
  button.type = type;
  button.disabled = disabled;
  button.textContent = label || "Button";
  return button;
}

export function mountButtons(root = document) {
  root.querySelectorAll("[data-brand-button]").forEach((target) => {
    const button = createButton({
      label: target.dataset.label,
      variant: target.dataset.variant || "primary",
      disabled: target.dataset.disabled === "true",
    });
    target.replaceWith(button);
  });
}

if (typeof window !== "undefined") {
  window.CopilotoButton = { createButton, mountButtons };
}
