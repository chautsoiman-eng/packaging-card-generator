/* ============================================================
   英文 → 片假名 近似轉寫（純規則式，離線運算，唔靠翻譯服務）
   目標係人名／暱稱呢類短字（例如 WingWing、Chacha、Momo），
   唔係完整詞典級發音轉寫，效果僅供草稿參考，請自行校對修正。
   ============================================================ */

(function () {
  "use strict";

  const ROWS = {
    "": { a: "ア", i: "イ", u: "ウ", e: "エ", o: "オ" },
    k: { a: "カ", i: "キ", u: "ク", e: "ケ", o: "コ" },
    g: { a: "ガ", i: "ギ", u: "グ", e: "ゲ", o: "ゴ" },
    s: { a: "サ", i: "シ", u: "ス", e: "セ", o: "ソ" },
    z: { a: "ザ", i: "ジ", u: "ズ", e: "ゼ", o: "ゾ" },
    t: { a: "タ", i: "チ", u: "ツ", e: "テ", o: "ト" },
    d: { a: "ダ", i: "ヂ", u: "ヅ", e: "デ", o: "ド" },
    n: { a: "ナ", i: "ニ", u: "ヌ", e: "ネ", o: "ノ" },
    h: { a: "ハ", i: "ヒ", u: "フ", e: "ヘ", o: "ホ" },
    f: { a: "ファ", i: "フィ", u: "フ", e: "フェ", o: "フォ" },
    b: { a: "バ", i: "ビ", u: "ブ", e: "ベ", o: "ボ" },
    p: { a: "パ", i: "ピ", u: "プ", e: "ペ", o: "ポ" },
    m: { a: "マ", i: "ミ", u: "ム", e: "メ", o: "モ" },
    y: { a: "ヤ", i: "イ", u: "ユ", e: "イェ", o: "ヨ" },
    r: { a: "ラ", i: "リ", u: "ル", e: "レ", o: "ロ" },
    l: { a: "ラ", i: "リ", u: "ル", e: "レ", o: "ロ" },
    w: { a: "ワ", i: "ウィ", u: "ウ", e: "ウェ", o: "ウォ" },
    v: { a: "ヴァ", i: "ヴィ", u: "ヴ", e: "ヴェ", o: "ヴォ" },
    j: { a: "ジャ", i: "ジ", u: "ジュ", e: "ジェ", o: "ジョ" },
    ch: { a: "チャ", i: "チ", u: "チュ", e: "チェ", o: "チョ" },
    sh: { a: "シャ", i: "シ", u: "シュ", e: "シェ", o: "ショ" },
  };
  // 尾音冇跟母音時嘅預設母音（日文外來語慣例：t/d 用 o，其餘用 u）
  const DEFAULT_VOWEL = { t: "o", d: "o" };
  const VOWELS = new Set(["a", "e", "i", "o", "u"]);
  const DIPH = new Set(["A", "E", "I", "O", "U", "W", "Y"]);

  function diphKana(rowKey, mark) {
    const row = ROWS[rowKey] || ROWS[""];
    switch (mark) {
      case "A": return row.a + "イ"; // like, night → ai
      case "E": return row.e + "イ"; // make, day → ei
      case "I": return row.i + "ー"; // ee/ea/ie → 長音 i
      case "O": return row.o + "ー"; // oa/ow(尾) → 長音 o
      case "U": return row.u + "ー"; // 長音 u（近似）
      case "W": return row.a + "ウ"; // ou/ow(中) → au
      case "Y": return row.o + "イ"; // oy/oi
      default: return "";
    }
  }

  function preprocess(word) {
    let w = word;

    // 1. 保護常見雙字母組合，避免被後面規則誤拆
    w = w.replace(/tch/g, "Qc")
         .replace(/dge/g, "Qj")
         .replace(/ck/g, "Qk")
         .replace(/ch/g, "C")
         .replace(/sh/g, "S")
         .replace(/th/g, "s") // 近似：唔分濁/清音，一律當 s 行
         .replace(/ph/g, "f")
         .replace(/wh/g, "w")
         .replace(/qu/g, "kw");

    // 2. 雙寫子音收窄（爆破音加小っ，其餘直接收埋一個）
    w = w.replace(/tt/g, "Qt").replace(/pp/g, "Qp").replace(/dd/g, "Qd")
         .replace(/gg/g, "Qg").replace(/bb/g, "Qb").replace(/ff/g, "Qf")
         .replace(/ss/g, "s").replace(/ll/g, "l").replace(/mm/g, "m")
         .replace(/nn/g, "n").replace(/rr/g, "r");

    // 3. ng／nk：跟 e/i/y 就係軟音（change → n+軟g），否則係鼻音尾（sing → ング）
    w = w.replace(/ng([eiy])/g, "nj$1");

    // 4. 剩低嘅 c／g 按後面母音判斷軟硬音
    w = w.replace(/c([eiy])/g, "s$1").replace(/c/g, "k");
    w = w.replace(/g([eiy])/g, "j$1");

    // 5. x：字尾帶促音，字中／字首唔帶
    w = w.replace(/x$/, "Qks").replace(/x/g, "ks");

    // 6. magic e（單母音＋單子音＋尾 e，尾 e 唔發音）
    w = w.replace(/([bcdfghjklmnpqrstvwyz])a([bcdfghjklmnpqrstvwyz])e$/, "$1E$2")
         .replace(/([bcdfghjklmnpqrstvwyz])i([bcdfghjklmnpqrstvwyz])e$/, "$1A$2")
         .replace(/([bcdfghjklmnpqrstvwyz])o([bcdfghjklmnpqrstvwyz])e$/, "$1O$2")
         .replace(/([bcdfghjklmnpqrstvwyz])u([bcdfghjklmnpqrstvwyz])e$/, "$1U$2")
         .replace(/([bcdfghjklmnpqrstvwyz])e([bcdfghjklmnpqrstvwyz])e$/, "$1I$2");
    // 未食到嘅尾 e（前面係子音）當靜音直接丟
    w = w.replace(/([bcdfghjklmnpqrstvwyz])e$/, "$1");

    // 7. 母音組合
    w = w.replace(/igh/g, "A")
         .replace(/ay/g, "E").replace(/ai/g, "E")
         .replace(/ee/g, "I").replace(/ea/g, "I")
         .replace(/ie$/, "I")
         .replace(/oa/g, "O")
         .replace(/oo/g, "U")
         .replace(/ow$/, "O").replace(/ow/g, "W")
         .replace(/ou/g, "W")
         .replace(/oy/g, "Y").replace(/oi/g, "Y");
    // y 當母音（唔喺開頭）→ i
    w = w.replace(/([^aeiouAEIOUWY])y(?![aeiouAEIOUWY])/g, "$1i")
         .replace(/([^aeiouAEIOUWY])y$/, "$1i");

    return w;
  }

  function scan(w) {
    let out = "";
    let i = 0;
    const n = w.length;
    const isVowelTok = (c) => VOWELS.has(c) || DIPH.has(c);

    while (i < n) {
      const c = w[i];

      if (c === "Q") { out += "ッ"; i++; continue; }

      if (c === "n") {
        if (w[i + 1] === "g" && !isVowelTok(w[i + 2])) { out += "ン" + ROWS.g.u; i += 2; continue; }
        if (w[i + 1] === "k") { out += "ン" + ROWS.k.u; i += 2; continue; }
        const nx = w[i + 1];
        if (nx && isVowelTok(nx)) {
          out += DIPH.has(nx) ? diphKana("n", nx) : ROWS.n[nx];
          i += 2;
        } else { out += "ン"; i++; }
        continue;
      }

      if (c === "r" || c === "l") {
        // 日文假名幾乎都係開音節（母音收尾），淨係 ン／ッ 呢兩個特殊音節例外
        const last = out.slice(-1);
        const prevVowel = out.length > 0 && !/[ンッ]$/.test(last);
        const nx = w[i + 1];
        if (c === "r" && prevVowel && !isVowelTok(nx)) {
          if (last !== "ー") out += "ー"; // 前面已經係長音就唔使再加一次
          i++; continue;
        }
        if (nx && isVowelTok(nx)) {
          out += DIPH.has(nx) ? diphKana(c, nx) : ROWS[c][nx];
          i += 2;
        } else {
          out += ROWS[c].u;
          i++;
        }
        continue;
      }

      if (isVowelTok(c)) {
        out += DIPH.has(c) ? diphKana("", c) : ROWS[""][c];
        i++;
        continue;
      }

      // 一般子音（含 placeholder C=ch, S=sh）
      const key = c === "C" ? "ch" : c === "S" ? "sh" : c;
      const row = ROWS[key];
      if (!row) { i++; continue; } // 認唔到嘅符號，跳過
      const nx = w[i + 1];
      if (nx && isVowelTok(nx)) {
        out += DIPH.has(nx) ? diphKana(key, nx) : row[nx];
        i += 2;
      } else {
        out += row[DEFAULT_VOWEL[key] || "u"];
        i++;
      }
    }
    return out;
  }

  function wordToKana(word) {
    const w = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!w) return "";
    return scan(preprocess(w));
  }

  /**
   * 將英文名字轉做近似片假名。保留 "&" 做全形＆，其餘標點／空格會拿走
   * （跟版樣「WingWing & Little M」→「インイン＆エムザイ」嘅格式一致）。
   * 結果僅供草稿，人手校對後先用得。
   */
  function englishToKatakana(text) {
    if (!text) return "";
    return text
      .split(/(&)/)
      .map((part) => (part === "&" ? "＆" : part.split(/\s+/).map(wordToKana).join("")))
      .join("");
  }

  window.englishToKatakana = englishToKatakana;
})();
