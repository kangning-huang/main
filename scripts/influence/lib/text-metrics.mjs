/**
 * Estimated advance width for DM Sans at build time (CJK at 1em). Errs wide.
 * Shared by Field & Shelf shelf layout (and formerly Ripple).
 */
const NARROW = new Set([..." .,:;'!|il"]);
const SEMI = new Set([..."fjrt()-/[]’"]);
const WIDE = new Set([..."mwMW"]);

export function textWidth(str, size) {
  let em = 0;
  for (const ch of str) {
    if (/[⺀-鿿豈-﫿＀-￯]/.test(ch)) em += 1.0;
    else if (NARROW.has(ch)) em += 0.27;
    else if (SEMI.has(ch)) em += 0.36;
    else if (WIDE.has(ch)) em += 0.82;
    else if (/[A-Z]/.test(ch)) em += 0.66;
    else if (/[0-9]/.test(ch)) em += 0.58;
    else em += 0.54;
  }
  return em * size * 1.05;
}
