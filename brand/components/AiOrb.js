export const ORB_STATES = ["idle", "listening", "thinking", "speaking", "inactive"];

export function createAiOrb({ state = "idle", label = "Copiloto Pyme AI" } = {}) {
  const safeState = ORB_STATES.includes(state) ? state : "idle";
  const orb = document.createElement("div");
  orb.className = `ai-orb ai-orb-${safeState}`;
  orb.setAttribute("role", "img");
  orb.setAttribute("aria-label", `${label}: ${safeState}`);
  orb.dataset.state = safeState;
  orb.innerHTML = `
    <span class="ai-orb-glow"></span>
    <span class="ai-orb-shell">
      <span class="ai-orb-core"></span>
      <span class="ai-orb-orbit"></span>
    </span>
  `;
  return orb;
}

export function setAiOrbState(orb, state) {
  if (!orb || !ORB_STATES.includes(state)) return;
  ORB_STATES.forEach((item) => orb.classList.remove(`ai-orb-${item}`));
  orb.classList.add(`ai-orb-${state}`);
  orb.dataset.state = state;
  orb.setAttribute("aria-label", `Copiloto Pyme AI: ${state}`);
}

export function mountAiOrbs(root = document) {
  root.querySelectorAll("[data-ai-orb]").forEach((target) => {
    const orb = createAiOrb({ state: target.dataset.state || "idle" });
    target.replaceChildren(orb);
  });
}

if (typeof window !== "undefined") {
  window.CopilotoAiOrb = { createAiOrb, setAiOrbState, mountAiOrbs, ORB_STATES };
}
