// Romanized -> Myanmar (Unicode), for the website's "Try it" box.
// A line-for-line port of the app engine (myanmar_keyboard: MyanmarTransliterator/Mapping.swift +
// Transliterator.swift, and the Windows C++ port). Keep the tables in sync with those files.
// Plain ES5 so it runs everywhere.
(function (global) {
  "use strict";

  var ASAT = "\u103A", VIRAMA = "\u1039", WA_MEDIAL = "\u103D";
  var ROUND_AA = "\u102C", TALL_AA = "\u102B", CARRIER = "\u1021";

  var CONSONANTS = {
    k: "\u1000", kh: "\u1001", g: "\u1002", gh: "\u1003", ng: "\u1004",
    c: "\u1005", ch: "\u1006", j: "\u1007", jh: "\u1008", ny: "\u100A", NY: "\u1009",
    T: "\u100B", Th: "\u100C", D: "\u100D", Dh: "\u100E", N: "\u100F",
    t: "\u1010", th: "\u1011", d: "\u1012", dh: "\u1013", n: "\u1014",
    p: "\u1015", ph: "\u1016", b: "\u1017", bh: "\u1018", m: "\u1019",
    y: "\u101A", r: "\u101B", l: "\u101C", w: "\u101D",
    s: "\u101E", h: "\u101F", L: "\u1020",
    f: "\u1016", z: "\u1007", v: "\u101D", sh: "\u1006", hs: "\u1006"
  };
  var MEDIALS = { y: "\u103B", r: "\u103C", w: "\u103D", h: "\u103E" };
  var MATRAS = {
    a: "", aa: "\u102C", i: "\u102D", ii: "\u102E", u: "\u102F", uu: "\u1030",
    e: "\u1031", ai: "\u1032", o: "\u102D\u102F", aw: "\u1031\u102C", au: "\u1031\u102C"
  };
  var TALL_AA_CONSONANTS = {
    "\u1001": 1, "\u1002": 1, "\u1003": 1, "\u1004": 1, "\u1012": 1, "\u100E": 1, "\u1015": 1, "\u101D": 1
  };
  var INDEPENDENT_VOWELS = {
    a: "\u1021", aa: "\u1021\u102C", i: "\u1021\u102D", ii: "\u1021\u102E",
    u: "\u1021\u102F", uu: "\u1021\u1030", e: "\u1021\u1031", ai: "\u1021\u1032",
    o: "\u1021\u102D\u102F", au: "\u1021\u1031\u102C", aw: "\u1021\u1031\u102C"
  };
  var SPECIALS = {
    ";": ASAT, "_": VIRAMA, M: "\u1036", q: "\u1036", ".": "\u1037",
    ":": "\u1038", x: "\u1038", "/": "\u104A", "//": "\u104B"
  };

  function has(table, key) { return Object.prototype.hasOwnProperty.call(table, key); }

  function transliterate(input, convertDigits) {
    var n = input.length, out = "", i = 0;
    var inCluster = false, syllableOpen = false, head = null, hasWa = false, afterVirama = false;

    // Longest key (up to maxLen) in table that is a prefix of input at pos -> [value, len] or null.
    function matchAt(pos, table, maxLen) {
      for (var len = Math.min(maxLen, n - pos); len >= 1; len--) {
        var key = input.substr(pos, len);
        if (has(table, key)) return [table[key], len];
      }
      return null;
    }
    // A consonant ending at pos closes the syllable (final + asat) unless a vowel, medial, or the
    // explicit "_" / ";" follows.
    function isFinal(pos) {
      if (pos >= n) return true;
      if (matchAt(pos, MEDIALS, 1) || matchAt(pos, MATRAS, 2)) return false;
      var next = input.charAt(pos);
      return !(next === "_" || next === ";");
    }
    function aaAdjusted(m) {
      if (m !== ROUND_AA) return m;
      if (hasWa || (head && has(TALL_AA_CONSONANTS, head))) return TALL_AA;
      return m;
    }
    function openSyllable(h) { head = h; inCluster = true; syllableOpen = true; hasWa = false; }
    function closeSyllable() { inCluster = false; syllableOpen = false; head = null; hasWa = false; }

    while (i < n) {
      var hit;
      if (inCluster && (hit = matchAt(i, MEDIALS, 1))) {               // 1. medial
        out += hit[0];
        if (hit[0] === WA_MEDIAL) hasWa = true;
        i += hit[1];
        continue;
      }
      if (syllableOpen && (hit = matchAt(i, MATRAS, 2))) {             // 2. vowel sign
        out += aaAdjusted(hit[0]);
        inCluster = false;
        i += hit[1];
        continue;
      }
      if ((hit = matchAt(i, CONSONANTS, 2))) {                         // 3. consonant
        if (afterVirama) {
          out += hit[0]; openSyllable(hit[0]); afterVirama = false;
        } else if (syllableOpen && isFinal(i + hit[1])) {
          out += hit[0] + ASAT; closeSyllable();
        } else {
          out += hit[0]; openSyllable(hit[0]);
        }
        i += hit[1];
        continue;
      }
      if (!syllableOpen && (hit = matchAt(i, INDEPENDENT_VOWELS, 2))) { // 4. vowel-initial syllable
        out += hit[0];
        head = CARRIER; inCluster = false; syllableOpen = true; hasWa = false;
        i += hit[1];
        continue;
      }
      if ((hit = matchAt(i, SPECIALS, 2))) {                           // 5. signs / marks
        out += hit[0];
        if (hit[0] === VIRAMA) { afterVirama = true; inCluster = false; }
        else if (hit[0] === ASAT) closeSyllable();
        i += hit[1];
        continue;
      }
      var ch = input.charAt(i);                                         // 6. digits
      if (convertDigits && ch >= "0" && ch <= "9") {
        out += String.fromCharCode(0x1040 + (ch.charCodeAt(0) - 48));
        i += 1;
        continue;
      }
      if (ch === " " || ch === "\n" || ch === "\t") closeSyllable();    // 7. pass through
      out += ch;
      i += 1;
    }
    return out;
  }

  global.MyanmarTranslit = { transliterate: transliterate };
})(this);
