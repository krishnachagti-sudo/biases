// Take the em dashes out of the corpus, by rule, without touching a word.
//
// docs/VOICE.md sets the target: at most one em dash per entry, usually none.
// The corpus had 2,274 strings carrying at least one and some carrying four,
// which is the loudest single signal to a 2026 reader that prose was generated
// rather than written.
//
// THE ONE INVARIANT: this only ever changes punctuation, whitespace, and the
// case of a letter that has just become sentence-initial. It never inserts,
// deletes or reorders a word. That is what makes a 2,000-string mechanical pass
// safe on human-checked content — no claim can drift, and the diff can be read.
//
// It is also deliberately incomplete. Rules fire only where the right
// replacement is unambiguous; anything needing judgement is counted and left
// alone. A script that guesses produces worse prose than the tic it removed.

const DASH = '—';

/** Sentence-initial capital for a clause promoted to its own sentence. */
function capitalise(s) {
  const m = /^(\s*)(.)(.*)$/s.exec(s);
  if (!m) return s;
  // Leave it alone if the first word is already capitalised (a proper noun) or
  // is not a letter at all (a number, a quote mark).
  if (!/\p{Ll}/u.test(m[2])) return s;
  return m[1] + m[2].toUpperCase() + m[3];
}

// A tail opening with one of these is a qualifier hanging off the main clause.
// A comma is what it wanted.
const QUALIFIER = /^(though|although|but|yet|while|whereas|and|or|so|because|since|unless|until|before|after|if|when|whether|rather|not|never|except|despite|even|only)\b/i;

// A tail opening with one of these is a new independent clause. It deserves a
// full stop, which is the mark the writer was avoiding.
const NEW_CLAUSE = /^(it|they|he|she|this|that|these|those|there|we|one|its|their|his|her|you|i)\s+\p{L}/iu;

// Aux and copula forms: their presence early in a tail means it has a subject
// and a verb, so it is a clause rather than an appositive noun phrase.
const HAS_VERB = /\b(is|are|was|were|be|been|being|has|have|had|does|do|did|will|would|can|could|may|might|must|should)\b/i;

/**
 * Rewrite one string. Returns { text, fixed, left }.
 *
 * Paired dashes are handled first and as a unit, because `a — b — c` is one
 * construction; treating each dash separately would produce `a, b: c`.
 */
export function dedash(input) {
  let s = String(input == null ? '' : input);
  if (!s.includes(DASH)) return { text: s, fixed: 0, left: 0 };
  let fixed = 0;

  // --- paired: an aside fenced by two dashes inside one sentence ------------
  //
  // Commas where the host sentence is otherwise comma-free, because a pair of
  // commas is the quietest way to fence an aside. Parentheses as soon as there
  // is a second level of commas — either inside the aside or already in the
  // sentence around it — since three comma pairs in one sentence stop a reader
  // being able to tell which closes which. That second case matters more than
  // it sounds: "complete markets, perfect competition, full information and no
  // public goods, conditions never met exactly, and is silent…" reads as though
  // the aside were another item in the list.
  const paired = new RegExp(`\\s*${DASH}\\s*([^${DASH}]{1,120}?)\\s*${DASH}(?=\\s)`, 'g');
  s = s.replace(paired, (m, inner, offset, whole) => {
    // A dash pair straddling a sentence boundary is two unrelated dashes that
    // happen to be adjacent, not an aside. Leave those to the single-dash pass.
    if (/[.!?]\s/.test(inner)) return m;
    // The host sentence is everything back to the previous sentence-ending mark.
    const before = whole.slice(0, offset);
    const lastEnd = Math.max(before.lastIndexOf('. '), before.lastIndexOf('! '), before.lastIndexOf('? '));
    const host = lastEnd >= 0 ? before.slice(lastEnd + 2) : before;
    fixed++;
    // An aside that is itself an independent clause ("he estimated five to
    // seven") cannot be fenced with commas without making a comma splice.
    const isClause = NEW_CLAUSE.test(inner) || /^\p{Lu}\p{L}+\s+\p{Ll}+ed\b/u.test(inner);
    if (inner.includes(',') || host.includes(',') || isClause) return ` (${inner})`;
    return `, ${inner},`;
  });
  // A closing bracket sitting immediately before a new independent clause still
  // needs the comma the second dash was providing: "(…), so it never accrues",
  // "(…), there is a number".
  s = s.replace(/\)\s+(so|but|yet|there|it|they|this|these|which|rather|not|while|since|even|though|although|whereas|each)\s/g, (m, c) => `), ${c} `);
  // The aside's own closing punctuation can collide with punctuation the
  // sentence already had at that point.
  s = s.replace(/,\s*([^,]{1,120}?),\s*([.,;:!?])/g, (m, inner, mark) => `, ${inner}${mark}`);
  s = s.replace(/\(([^()]*)\)\s*([.,;:!?])/g, (m, inner, mark) => `(${inner})${mark}`);

  // --- single: a head, a dash, a tail --------------------------------------
  //
  // `from` walks forward past dashes this cannot classify, instead of stopping
  // at the first one. The earlier version took s.indexOf(DASH) every pass and
  // broke on failure, so a single hard case -- "Force 0 — Calm", where the head
  // is a two-word label -- shielded every later dash in the same string from
  // ever being looked at. That left 44 dashes standing across 36 entries and
  // made the pass look like it had run out of safe conversions when it had only
  // run into one.
  let guard = 0;
  let from = 0;
  while (guard++ < 24) {
    const i = s.indexOf(DASH, from);
    if (i < 0) break;
    const head = s.slice(0, i).replace(/\s+$/, '');
    const tail = s.slice(i + DASH.length).replace(/^\s+/, '');
    if (!head || !tail) { from = i + DASH.length; continue; }

    // A dash between two digits, or inside a joint name, is an en-dash job that
    // happens to be typed long. Not this pass's business.
    if (/\d$/.test(head) && /^\d/.test(tail)) { from = i + DASH.length; continue; }
    if (/\p{Lu}\p{L}*$/u.test(head) && /^\p{Lu}/u.test(tail)) { from = i + DASH.length; continue; }
    // The head has to be able to stand as a clause for a colon or a full stop
    // to read. This was once a test for an auxiliary verb, which rejected every
    // head whose only verb was lexical -- "Real searches violate these", "the
    // field circles the wire and weakens with distance" -- and so declined most
    // of the conversions worth making. Word count is a cruder proxy and a far
    // better one: a four-word head is a clause, a two-word head is a label.
    const headWords = head.split(/\s+/).filter(Boolean).length;

    let joined = null;
    // A relative clause attaches to what precedes it; a colon announces
    // something new, so the two cannot be combined. Comma every time.
    if (/^(which|who|whom|whose)\b/i.test(tail)) {
      joined = `${head}, ${tail}`;
    } else if (QUALIFIER.test(tail)) {
      joined = `${head}, ${tail}`;
    } else if (NEW_CLAUSE.test(tail) && HAS_VERB.test(tail.slice(0, 60))) {
      // A tail with its own subject and verb is a second sentence the writer
      // did not want to start. Start it.
      if (headWords >= 4 && /[\p{L}\p{N})"'’”]$/u.test(head)) joined = `${head}. ${capitalise(tail)}`;
    } else if (!HAS_VERB.test(tail.slice(0, 45))
               || /^(the|a|an|each|every|some|most|no|all|both|plenty|many|few|another)\b/i.test(tail)) {
      // Two cases, one mark. Either the tail has no verb near the front, so it
      // is an appositive or a gloss; or it opens on a determiner, which means a
      // fresh noun phrase is being introduced even when it goes on to carry its
      // own verb ("…as ordinary self-doubt — the defining feature is the
      // mismatch"). Both are announcements, and a colon announces
      // -- unless this sentence has spent its colon already. Two in one sentence
      // is a worse fault than the dash was, because the reader cannot tell which
      // announcement the second one belongs to. Where the gloss runs to the end
      // of the sentence, brackets do the same job silently; where it does not,
      // the dash stays and a human can decide.
      const cut = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
      const hostSentence = cut >= 0 ? head.slice(cut + 2) : head;
      if (headWords < 4) {
        joined = null;
      } else if (!hostSentence.includes(':')) {
        joined = `${head}: ${tail}`;
      } else {
        const end = /^([^.!?:]*)([.!?])(\s[\s\S]*)?$/.exec(tail);
        if (end) joined = `${head} (${end[1].replace(/\s+$/, '')})${end[2]}${end[3] || ''}`;
      }
    }
    if (joined == null) { from = i + DASH.length; continue; } // judgement call: leave it
    s = joined;
    fixed++;
    from = 0;   // the string changed shape; rescan from the start
  }

  // Tidy: a colon or full stop should not have inherited a comma from the head.
  s = s.replace(/,\s*:/g, ':').replace(/,\s*\./g, '.').replace(/\s{2,}/g, ' ');

  return { text: s, fixed, left: (s.match(new RegExp(DASH, 'g')) || []).length };
}
