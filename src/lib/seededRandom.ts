/**
 * Tiny seeded pseudo-random number generator (Mulberry32).
 * Produces the same sequence for the same seed every time — no randomness, no server.
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert a string room code like "A9B2" into a numeric seed. */
function codeToSeed(code: string): number {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (Math.imul(31, hash) + code.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Pick a random item from an array deterministically from a room code. */
export function seededPick<T>(array: T[], roomCode: string): T {
  const rand = mulberry32(codeToSeed(roomCode));
  const index = Math.floor(rand() * array.length);
  return array[index];
}

/** Generate a short random room code (4 uppercase alphanumeric chars). */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
