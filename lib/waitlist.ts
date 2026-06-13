export function createWaitlistTurn(seed?: string | null) {
  const source = seed?.trim() || `${Date.now()}`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 9000;
  }

  return `CP-${String(hash + 1000).padStart(4, "0")}`;
}

export function createWaitlistUrl(seed?: string | null) {
  return `/waitlist?turno=${encodeURIComponent(createWaitlistTurn(seed))}`;
}

export function normalizeWaitlistTurn(turn?: string | string[] | null) {
  const rawTurn = Array.isArray(turn) ? turn[0] : turn;
  const normalizedTurn = rawTurn?.trim().toUpperCase();

  if (!normalizedTurn || !/^CP-\d{4}$/.test(normalizedTurn)) {
    return "CP-0001";
  }

  return normalizedTurn;
}
