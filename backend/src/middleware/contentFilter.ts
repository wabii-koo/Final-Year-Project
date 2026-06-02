/**
 * Content Filter Middleware
 * Guards all messages between Guardians and Homeroom Teachers.
 * If offensive or inappropriate content is detected the message
 * is BLOCKED and never saved to the database.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Offensive word list  (English + common transliterations)
// Add / remove words here as needed for your school community.
// ─────────────────────────────────────────────────────────────────────────────
const OFFENSIVE_WORDS: string[] = [
  // --- English profanity & insults ---
  'fuck', 'shit', 'bitch', 'bastard', 'asshole', 'ass', 'damn', 'crap',
  'piss', 'dick', 'cock', 'pussy', 'cunt', 'motherfucker', 'whore', 'slut',
  'retard', 'idiot', 'stupid', 'moron', 'loser', 'hate', 'kill', 'die',
  'ugly', 'fat', 'dumb', 'fool', 'jerk', 'freak',

  // --- Threats / violence ---
  'i will kill', 'i will hurt', 'you are dead', 'beat you', 'punch you',

  // --- Common Amharic / transliterated insults ---
  'leba',      // thief
  'ayhon',     // shameful insult
  'tebasabe',  // cursing
  'wusha',     // dog (used as insult)
  'ahiya',     // donkey (used as insult)
  'yeteleba',  // son of a thief
  'gematam',   // greedy/stingy insult
  'bedel',     // stupid/idiot
  'ante leba',
  'anchi leba',
  'mechachal',

  // --- Oromo insults ---
  'gaangee',   // donkey (insult)
  'soqaa',     // dirty/filthy insult
];

// ─────────────────────────────────────────────────────────────────────────────
// Result returned by the filter
// ─────────────────────────────────────────────────────────────────────────────
export interface FilterResult {
  isClean: boolean;
  blockedWord?: string;    // the first matched offensive word (for logging)
  reason?: string;         // human-readable rejection reason
}

// ─────────────────────────────────────────────────────────────────────────────
// Main filter function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scans `text` for offensive content.
 *
 * Strategy:
 *  1. Normalize the text (lowercase, collapse whitespace).
 *  2. Strip common character substitutions (l33t-speak): @ → a, 3 → e, etc.
 *  3. Check the normalized string against every word in OFFENSIVE_WORDS.
 *
 * @param text  The raw message content typed by the user.
 * @returns     FilterResult — { isClean: true } or { isClean: false, ... }
 */
export function filterContent(text: string): FilterResult {
  if (!text || text.trim().length === 0) {
    return { isClean: true };
  }

  // Step 1 — Lowercase + collapse extra whitespace
  let normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');

  // Step 2 — Normalise common leet-speak substitutions so filters aren't bypassed
  // e.g.  "sh!t" → "shit",  "f*ck" → "fuck",  "@ss" → "ass"
  normalized = normalized
    .replace(/@/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/0/g, 'o')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i')
    .replace(/\*/g, '')   // remove asterisk wildcards used to mask words
    .replace(/#/g, 'h')
    .replace(/\+/g, 't');

  // Step 3 — Check every offensive word
  for (const word of OFFENSIVE_WORDS) {
    // Use word-boundary matching where possible so "assess" doesn't match "ass"
    // For multi-word phrases we do a simple includes() check.
    const isPhrase = word.includes(' ');

    if (isPhrase) {
      if (normalized.includes(word)) {
        return {
          isClean: false,
          blockedWord: word,
          reason: `Your message contains inappropriate language ("${word}") and cannot be delivered. Please keep all communication respectful.`,
        };
      }
    } else {
      // Single word — use word-boundary regex
      const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
      if (regex.test(normalized)) {
        return {
          isClean: false,
          blockedWord: word,
          reason: `Your message contains inappropriate language and cannot be delivered. Please keep all communication respectful and professional.`,
        };
      }
    }
  }

  return { isClean: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — escape special regex characters inside a word
// ─────────────────────────────────────────────────────────────────────────────
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
