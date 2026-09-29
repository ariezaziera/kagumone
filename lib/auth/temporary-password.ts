import { randomInt } from "node:crypto";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function temporaryPassword(length = 12) {
  return Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join("");
}
