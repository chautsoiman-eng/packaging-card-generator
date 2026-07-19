/* ============================================================
   公仔包裝卡產生工具 — Moment Lab 內部自用
   照片全程喺瀏覽器本機處理，唔會上傳任何伺服器。
   版面座標全部由原 Canva 匯出 PDF 逐一量度復刻（單位：pt，
   頁面 595.5 × 842.25 pt = A4）。
   ============================================================ */

/* ==================== 固定內容設定區 ====================
   之後要改字（警語、材質、公司資訊…）直接改呢一區就得。 */
const FIXED = {
  // 右上 Logo（文字構成，冇獨立圖檔）
  logoLine1: "CHANMANS’",
  logoLine2: "WORKS",

  // 年齡警語框
  warnHeadCjk: "年齡建議與警告標語",
  warnHeadEn: "(Age Recommendation & Warnings)",
  warnLines: [
    "WARNING: CHOKING HAZARD – Small parts. Not for children under 3 years.",
    "対象年齢：15歳以上 / Ages15&Up 警告：窒息の危険 - 小さな部品あり。",
    "3歳未満のお子様には与えないでください。 /",
  ],

  // 使用說明框
  usageLines: [
    { text: "使用說明 (Usage Instructions) 付属の表情パーツと手首パーツを交換不可能です /", headChars: 4 },
    { text: "Excludes interchangeable face and hand parts." },
    { text: "簡単なイラスト付き組み立て説明書は含まれていません /" },
    { text: "Not comes with a simple pictorial assembly guide." },
  ],

  // 材質框
  matLines: [
    { text: "材質・安全標章・認證圖示 (Materials & Safety Marks)", headChars: 12 },
    { text: "材質：ABS、PVC / Materials: ABS & PVC" },
    { text: "CEマークおよびSTマーク表示 / Displays CE and ST" },
    { text: "safety certification marks" },
  ],

  // 左下公司資訊小字（{code} {jp} {en} 會自動代入輸入欄）
  finePrint: [
    { tpl: "ねんどろいど No. {code} 「{jp}」 /" },
    { tpl: "Nendoroid No. {code} “{en}”" },
    { tpl: "発売元：株式会社グッドスマイルカンパニー /", gapBefore: true },
    { tpl: "Manufacturer: CHANMANS’WORK, Inc." },
    { tpl: "公式サイト / Official Website:" },
    { tpl: "{website}" },
    { tpl: "お問い合わせ先 / Contact:" },
    { tpl: "chanyinman6@gmail.com" },
  ],
};

/* ==================== 預設配色組（快速起步用） ====================
   light = 卡底色，deep = Logo 第一行（CHANMANS'）強調色，
   works = Logo 第二行（WORKS）字色。三隻色之後都可以自由改，
   撳配色組只係一鍵套用個起步值，唔限死一定要用邊組。 */
const PALETTES = [
  { id: "sea",    name: "海藍",   light: "#8fc5d5", deep: "#5599ad", works: "#67686b" }, // 原版
  { id: "sunset", name: "日落",   light: "#f0c8a4", deep: "#cf8a52", works: "#7a5a3f" },
  { id: "forest", name: "森林",   light: "#b7cfae", deep: "#729d67", works: "#4f6a4a" },
  { id: "night",  name: "夜藍",   light: "#a9b6cf", deep: "#5f7099", works: "#454f66" },
  { id: "blossom",name: "粉嫩",   light: "#f2c4ce", deep: "#c97f95", works: "#7a5361" },
];

/* ==================== 版面幾何（由原 PDF 量度，單位 pt） ==================== */
const PAGE = { w: 595.5, h: 842.25 };

const T = {
  // 正面卡底（淺藍色紙）
  sheet: { x: 108.5, y: 15.1, w: 387.2, h: 451.9 },

  // 刀模外框（描邊中心線座標）
  die: {
    left: 154.44, right: 440.56, top: 24.32, bottom: 452.08,
    // 頂部凹位
    notchLx: 241.04, notchRx: 353.96, notchY: 38.49, notchLx2: 257.69, notchRx2: 337.31,
    // 左右手指凹位
    recessTop: 167.58, recessInStart: 184.23, recessInEnd: 292.18, recessBottom: 308.83,
    recessDepth: 14.16, // 邊線向內移嘅距離
    // 底部插舌
    flap: {
      blx: 237.59, brx: 357.77,           // 落喺底邊嘅位置
      dlx: 248.86, drx: 345.94, dy: 411.47, // 斜線頂
      tlx: 272.0, trx: 323.0, ty: 394.01,   // 圓弧後嘅頂部橫線
    },
  },

  // 正面照片範圍（刀模內、落到 y=310 為止）
  photoBottom: 310.0,

  // 照片上嘅白色文字（日期編碼＋名字）
  code:   { rightX: 258.03, baseline: 297.13, size: 36 },
  nameEn: { x: 269.80, baseline: 281.0, size: 11 },
  rule:   { x: 270.43, y: 287.03, minW: 123.4, extra: 17.6, lw: 1.4 },
  nameJp: { x: 269.80, baseline: 297.3, size: 8 },

  // 右上 Logo
  logo1: { x: 381.24, baseline: 42.13, size: 8.92, targetW: 52.07 },
  logo2: { x: 381.24, baseline: 53.28, size: 14.27, targetW: 49.93 },

  // 資訊白框（x, y, w, h）
  boxWarn:  { x: 162.82, y: 315.5, w: 161.63, h: 27.8 },
  boxUsage: { x: 162.82, y: 347.08, w: 161.6, h: 28.2 },
  boxMat:   { x: 329.99, y: 315.5, w: 101.89, h: 27.8 },
  boxRadius: 3.5,
  boxStroke: 0.8,

  // 主題名（Shrikhand，右欄置中）
  theme: { cx: 380.95, baseline: 365.6, size: 10, maxW: 96 },

  // QR code（白底方塊 + QR 本體）
  qrBox: { x: 375.94, y: 385.81, w: 45.66, h: 45.66, r: 3 },
  qrPad: 3.2,

  // 背景卡（相片順時針轉 90°，相片頂部朝右）
  bg:    { x: 37.3, y: 470.8, w: 520.2, h: 349.3 },
  frame: { x: 75.27, y: 499.11, w: 354.25, h: 292.35, lw: 0.8 },
};

const INK = "#231f20";      // 深灰文字／框線

// 匯出尺寸：A4 300dpi
const EXPORT_W = 2480, EXPORT_H = 3508;

/* ==================== 狀態 ==================== */
const state = {
  photo: null,      // 正面照片 HTMLImageElement
  bgPhoto: null,    // 背景卡另一張相（可選；null = 用同一張）
  // 三隻可自由揀嘅顏色：卡底色／LOGO 強調色／WORKS 字色
  colors: { light: PALETTES[0].light, deep: PALETTES[0].deep, works: PALETTES[0].works },
  paletteManual: false,
  nameJpAuto: true, // 日文行係咪跟住英文行自動產生（一旦手動改過就轉 false）
  // 正面照片取景：zoom ≥1，cx/cy = 取景中心（0~1 相對於原圖）
  front: { zoom: 1, cx: 0.5, cy: 0.5 },
  // 背景卡裁切：同一個模型（於背景相片上）
  bg: { zoom: 1, cx: 0.5, cy: 0.35 },
  // 背景卡內框位置（pt，可拖）
  frame: { x: T.frame.x, y: T.frame.y },
  // 主題／行程名文字：位置＋字級都可以自由拖／調（pt）
  theme: { cx: T.theme.cx, baseline: T.theme.baseline, size: T.theme.size },
  persons: [],      // 人物偵測結果（背景相片座標）
  personsImg: null, // persons 係對邊張相計嘅
  detector: null, detectorFailed: false,
  segmenter: null, segmenterFailed: false,
  // 人物移除（預設唔開，需要嘅話自己撳掣開）
  eraseEnabled: false,
  eraseMask: null,  // Uint8Array（背景相片解像度），1 = 要抹走
  bgClean: null,    // { src: 原相, canvas: 已抹走人物嘅版本 }
  eraseBusy: false,
  adjustTarget: "front",
};

/* image 或 canvas 嘅闊高 */
const imgW = (im) => im.naturalWidth || im.width;
const imgH = (im) => im.naturalHeight || im.height;

/* ==================== 工具函數 ==================== */
const $ = (id) => document.getElementById(id);

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* 刀模外框：一條連續閉合切線（含頂部凹位、左右手指位、底部插舌） */
function dieCutPath(ctx, s) {
  const d = T.die, f = d.flap, k = d.recessDepth;
  const P = (x, y) => [x * s, y * s];
  ctx.beginPath();
  ctx.moveTo(...P(d.left, d.top));
  // 頂邊（左段）→ 凹位
  ctx.lineTo(...P(d.notchLx, d.top));
  ctx.bezierCurveTo(...P(d.notchLx + 6.5, d.top), ...P(d.notchLx + 9, d.notchY), ...P(d.notchLx2, d.notchY));
  ctx.lineTo(...P(d.notchRx2, d.notchY));
  ctx.bezierCurveTo(...P(d.notchRx - 9, d.notchY), ...P(d.notchRx - 6.5, d.top), ...P(d.notchRx, d.top));
  ctx.lineTo(...P(d.right, d.top));
  // 右邊 → 手指凹位
  ctx.lineTo(...P(d.right, d.recessTop));
  ctx.bezierCurveTo(...P(d.right, d.recessTop + 8.5), ...P(d.right - k, d.recessInStart - 8.5), ...P(d.right - k, d.recessInStart));
  ctx.lineTo(...P(d.right - k, d.recessInEnd));
  ctx.bezierCurveTo(...P(d.right - k, d.recessInEnd + 8.5), ...P(d.right, d.recessBottom - 8.5), ...P(d.right, d.recessBottom));
  ctx.lineTo(...P(d.right, d.bottom));
  // 底邊（右段）→ 插舌
  ctx.lineTo(...P(f.brx, d.bottom));
  ctx.lineTo(...P(f.drx, f.dy));
  ctx.bezierCurveTo(...P(f.drx - 3, f.dy - 10.2), ...P(f.trx + 10.6, f.ty), ...P(f.trx, f.ty));
  ctx.lineTo(...P(f.tlx, f.ty));
  ctx.bezierCurveTo(...P(f.tlx - 10.6, f.ty), ...P(f.dlx + 3, f.dy - 10.2), ...P(f.dlx, f.dy));
  ctx.lineTo(...P(f.blx, d.bottom));
  // 底邊（左段）→ 左邊手指凹位
  ctx.lineTo(...P(d.left, d.bottom));
  ctx.lineTo(...P(d.left, d.recessBottom));
  ctx.bezierCurveTo(...P(d.left, d.recessBottom - 8.5), ...P(d.left + k, d.recessInEnd + 8.5), ...P(d.left + k, d.recessInEnd));
  ctx.lineTo(...P(d.left + k, d.recessInStart));
  ctx.bezierCurveTo(...P(d.left + k, d.recessInStart - 8.5), ...P(d.left, d.recessTop + 8.5), ...P(d.left, d.recessTop));
  ctx.closePath();
}

/* 帶字距繪字；targetW 有值時自動調整字距貼齊原版闊度 */
function drawTracked(ctx, text, x, baseline, px, font, color, targetW) {
  ctx.font = font;
  ctx.fillStyle = color;
  if (targetW) {
    const natural = ctx.measureText(text).width;
    const n = Math.max(text.length - 1, 1);
    const sp = (targetW - natural) / n;
    if (Math.abs(sp) > 0.01 && "letterSpacing" in ctx) {
      ctx.letterSpacing = sp + "px";
      ctx.fillText(text, x, baseline);
      ctx.letterSpacing = "0px";
      return;
    }
  }
  ctx.fillText(text, x, baseline);
}

/* 過闊自動縮細再畫 */
function drawFit(ctx, text, x, baseline, maxW, align) {
  const w = ctx.measureText(text).width;
  ctx.save();
  if (w > maxW) {
    ctx.translate(align === "right" ? x : align === "center" ? x : x, baseline);
    ctx.scale(maxW / w, 1);
    ctx.textAlign = align || "left";
    ctx.fillText(text, 0, 0);
  } else {
    ctx.textAlign = align || "left";
    ctx.fillText(text, x, baseline);
  }
  ctx.restore();
  return Math.min(w, maxW);
}

/* 由取景模型計 source crop（cover 一個 destW:destH 嘅框） */
function computeCrop(img, view, destW, destH) {
  const W = imgW(img), H = imgH(img);
  const cover = Math.max(destW / W, destH / H);
  const sc = cover * view.zoom;
  let sw = destW / sc, sh = destH / sc;
  let sx = view.cx * W - sw / 2;
  let sy = view.cy * H - sh / 2;
  sx = Math.max(0, Math.min(W - sw, sx));
  sy = Math.max(0, Math.min(H - sh, sy));
  return { sx, sy, sw, sh };
}

/* ==================== 主繪製 ==================== */
function render(ctx, s, forExport) {
  const pal = state.colors;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // 頁底白色
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAGE.w * s, PAGE.h * s);

  // ---- 正面卡底（配色淺色紙） ----
  ctx.fillStyle = pal.light;
  ctx.fillRect(T.sheet.x * s, T.sheet.y * s, T.sheet.w * s, T.sheet.h * s);

  // ---- 正面照片（剪裁喺刀模內、y ≤ 310） ----
  if (state.photo) {
    ctx.save();
    dieCutPath(ctx, s);
    ctx.clip();
    ctx.beginPath();
    ctx.rect(T.die.left * s, T.die.top * s, (T.die.right - T.die.left) * s, (T.photoBottom - T.die.top) * s);
    ctx.clip();
    const dw = T.die.right - T.die.left, dh = T.photoBottom - T.die.top;
    const c = computeCrop(state.photo, state.front, dw, dh);
    ctx.drawImage(state.photo, c.sx, c.sy, c.sw, c.sh,
      T.die.left * s, T.die.top * s, dw * s, dh * s);
    ctx.restore();
  } else {
    ctx.save();
    dieCutPath(ctx, s);
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.fillRect(T.die.left * s, T.die.top * s, (T.die.right - T.die.left) * s, (T.photoBottom - T.die.top) * s);
    ctx.fillStyle = "#7a8b91";
    ctx.font = `${13 * s}px "Noto Sans TC"`;
    ctx.textAlign = "center";
    ctx.fillText("請上載客戶照片", (T.die.left + T.die.right) / 2 * s, 170 * s);
    ctx.textAlign = "left";
    ctx.restore();
  }

  // ---- 刀模外框線 ----
  dieCutPath(ctx, s);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.7 * s;
  ctx.stroke();

  // ---- 照片上白色文字：日期編碼＋名字 ----
  const code = $("fldCode").value.trim() || "0000";
  const nameEn = $("fldNameEn").value.trim();
  const nameJp = $("fldNameJp").value.trim();
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${T.code.size * s}px Quicksand`;
  ctx.textAlign = "right";
  drawFit(ctx, code, T.code.rightX * s, T.code.baseline * s, 95 * s, "right");
  ctx.textAlign = "left";

  ctx.font = `700 ${T.nameEn.size * s}px Quicksand`;
  const enW = drawFit(ctx, nameEn, T.nameEn.x * s, T.nameEn.baseline * s, 152 * s);
  // 名字底線
  const ruleW = Math.max(T.rule.minW * s, enW + T.rule.extra * s);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = T.rule.lw * s;
  ctx.beginPath();
  ctx.moveTo(T.rule.x * s, T.rule.y * s);
  ctx.lineTo(T.rule.x * s + ruleW, T.rule.y * s);
  ctx.stroke();
  ctx.font = `700 ${T.nameJp.size * s}px "Noto Sans TC"`;
  ctx.fillStyle = "#ffffff";
  drawFit(ctx, nameJp, T.nameJp.x * s, T.nameJp.baseline * s, 152 * s);

  // ---- 右上 Logo ----
  drawTracked(ctx, FIXED.logoLine1, T.logo1.x * s, T.logo1.baseline * s, T.logo1.size * s,
    `400 ${T.logo1.size * s}px "Noto Sans"`, pal.deep, T.logo1.targetW * s);
  drawTracked(ctx, FIXED.logoLine2, T.logo2.x * s, T.logo2.baseline * s, T.logo2.size * s,
    `400 ${T.logo2.size * s}px "Noto Sans"`, pal.works, T.logo2.targetW * s);

  // ---- 三個資訊白框 ----
  for (const b of [T.boxWarn, T.boxUsage, T.boxMat]) {
    roundRectPath(ctx, b.x * s, b.y * s, b.w * s, b.h * s, T.boxRadius * s);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = T.boxStroke * s;
    ctx.stroke();
  }

  // ---- 框內文字 ----
  ctx.fillStyle = INK;
  const stack36 = `${3.6 * s}px Montserrat, "Noto Sans TC"`;
  const stack36b = `700 ${3.6 * s}px Montserrat, "Noto Sans TC"`;

  // 年齡警語框
  ctx.font = `700 ${5 * s}px "Noto Sans TC"`;
  ctx.fillText(FIXED.warnHeadCjk, 167.77 * s, 322.04 * s);
  ctx.font = `500 ${5 * s}px Montserrat`;
  ctx.fillText(FIXED.warnHeadEn, 215.65 * s, 322.04 * s);
  ctx.font = stack36;
  ctx.fillText(FIXED.warnLines[0], 167.77 * s, 327.89 * s);
  ctx.fillText(FIXED.warnLines[1], 167.77 * s, 333.29 * s);
  ctx.fillText(FIXED.warnLines[2], 167.77 * s, 338.7 * s);

  // 使用說明框
  const usageY = [354.39, 359.8, 365.2, 370.6];
  FIXED.usageLines.forEach((ln, i) => {
    drawHeadedLine(ctx, ln, 167.77 * s, usageY[i] * s, stack36, stack36b);
  });

  // 材質框
  const matY = [322.55, 327.95, 333.36, 338.76];
  FIXED.matLines.forEach((ln, i) => {
    drawHeadedLine(ctx, ln, 334.43 * s, matY[i] * s, stack36, stack36b);
  });

  // ---- 主題名（Shrikhand；位置＋字級可自由拖／調） ----
  const theme = $("fldTheme").value.trim();
  if (theme) {
    const themeScale = state.theme.size / T.theme.size;
    ctx.font = `${state.theme.size * s}px Shrikhand`;
    ctx.fillStyle = "#ffffff";
    drawFit(ctx, theme, state.theme.cx * s, state.theme.baseline * s, T.theme.maxW * themeScale * s, "center");
  }

  // ---- QR code ----
  drawQr(ctx, s);

  // ---- 左下公司資訊小字 ----
  ctx.fillStyle = INK;
  ctx.font = stack36;
  const jpName = nameJp || "—";
  const enName = nameEn || "—";
  const website = $("fldWebsite").value.trim() || "—";
  const fineY = [388.04, 394.34, 406.95, 413.25, 419.55, 425.85, 432.16, 438.46];
  FIXED.finePrint.forEach((ln, i) => {
    const text = ln.tpl.replace("{code}", code).replace("{jp}", jpName).replace("{en}", enName).replace("{website}", website);
    ctx.fillText(text, (i === 7 ? 165.79 : 164.74) * s, fineY[i] * s);
  });

  // ---- 背景卡（相片轉 90°；人物移除開啟時用「乾淨版」） ----
  const bgImg = state.bgPhoto || state.photo;
  const bgDraw = (state.eraseEnabled && state.bgClean && state.bgClean.src === bgImg)
    ? state.bgClean.canvas : bgImg;
  if (bgImg) {
    const B = T.bg;
    ctx.save();
    ctx.beginPath();
    ctx.rect(B.x * s, B.y * s, B.w * s, B.h * s);
    ctx.clip();
    // 順時針轉 90°：相片頂部朝右
    ctx.translate((B.x + B.w) * s, B.y * s);
    ctx.rotate(Math.PI / 2);
    // 旋轉後座標系：x 軸向頁下（長度 B.h），y 軸向頁左（長度 B.w）
    const c = computeCrop(bgDraw, state.bg, B.h, B.w);
    ctx.drawImage(bgDraw, c.sx, c.sy, c.sw, c.sh, 0, 0, B.h * s, B.w * s);
    ctx.restore();

    // 內框
    ctx.strokeStyle = INK;
    ctx.lineWidth = T.frame.lw * s;
    ctx.strokeRect(state.frame.x * s, state.frame.y * s, T.frame.w * s, T.frame.h * s);
  } else {
    ctx.fillStyle = "#eceae6";
    ctx.fillRect(T.bg.x * s, T.bg.y * s, T.bg.w * s, T.bg.h * s);
  }

  // 預覽模式＋未有乾淨版時，畫人物偵測提示框（唔會出現喺匯出圖）
  if (!forExport && state.adjustTarget === "bg" && state.persons.length && bgImg && bgDraw === bgImg) {
    drawPersonHints(ctx, s, bgImg);
  }
}

/* 行首幾隻字用粗體（「使用說明」「材質・安全標章・認證圖示」） */
function drawHeadedLine(ctx, ln, x, baseline, fontNormal, fontBold) {
  if (ln.headChars) {
    const head = ln.text.slice(0, ln.headChars);
    const rest = ln.text.slice(ln.headChars);
    ctx.font = fontBold;
    ctx.fillText(head, x, baseline);
    const w = ctx.measureText(head).width;
    ctx.font = fontNormal;
    ctx.fillText(rest, x + w, baseline);
  } else {
    ctx.font = fontNormal;
    ctx.fillText(ln.text, x, baseline);
  }
}

let qrCache = { text: null, model: null };
function drawQr(ctx, s) {
  const B = T.qrBox;
  roundRectPath(ctx, B.x * s, B.y * s, B.w * s, B.h * s, B.r * s);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  const url = $("fldQr").value.trim();
  if (!url) return;
  if (qrCache.text !== url) {
    try {
      const q = qrcode(0, "M");
      q.addData(url);
      q.make();
      qrCache = { text: url, model: q };
    } catch (e) {
      qrCache = { text: url, model: null };
    }
  }
  const q = qrCache.model;
  if (!q) return;
  const n = q.getModuleCount();
  const inner = (B.w - T.qrPad * 2) * s;
  const cell = inner / n;
  const ox = (B.x + T.qrPad) * s, oy = (B.y + T.qrPad) * s;
  ctx.fillStyle = "#000000";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (q.isDark(r, c)) {
        // 加少少重疊避免掃描間隙
        ctx.fillRect(ox + c * cell, oy + r * cell, cell + 0.35, cell + 0.35);
      }
    }
  }
}

/* 背景卡調整模式下，將人物偵測框投影出嚟提示 */
function drawPersonHints(ctx, s, img) {
  const B = T.bg;
  const c = computeCrop(img, state.bg, B.h, B.w);
  ctx.save();
  ctx.beginPath();
  ctx.rect(B.x * s, B.y * s, B.w * s, B.h * s);
  ctx.clip();
  ctx.translate((B.x + B.w) * s, B.y * s);
  ctx.rotate(Math.PI / 2);
  const sc = (B.h * s) / c.sw;
  ctx.strokeStyle = "rgba(220,60,60,.9)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  for (const p of state.persons) {
    ctx.strokeRect((p.x - c.sx) * sc, (p.y - c.sy) * sc, p.w * sc, p.h * sc);
  }
  ctx.restore();
}

/* ==================== 預覽 / 匯出 ==================== */
const previewCanvas = $("preview");
const PREVIEW_W = 900;
previewCanvas.width = PREVIEW_W;
previewCanvas.height = Math.round(PREVIEW_W * PAGE.h / PAGE.w);
const pctx = previewCanvas.getContext("2d");
const PS = PREVIEW_W / PAGE.w; // 預覽 scale

let rafPending = false;
function requestRender() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    render(pctx, PS, false);
  });
}

function renderExportCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;
  render(canvas.getContext("2d"), EXPORT_W / PAGE.w, true);
  return canvas;
}

function exportFileName() {
  // 檔名只用 ASCII：file:// 環境下中文檔名會被瀏覽器撇走
  const code = ($("fldCode").value.trim() || "card").replace(/[^A-Za-z0-9_-]/g, "");
  return `package-card-${code || "export"}.png`;
}

function exportPng() {
  const canvas = renderExportCanvas();
  canvas.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = exportFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  }, "image/png");
}

/* 後備方案：有啲網頁環境（例如嵌喺有安全限制嘅 iframe 入面睇）會擋咗
   直接下載，撳「下載」冇反應。呢個掣改為喺新分頁開返張成品圖，
   到時右鍵撳「另存圖片」／長按儲存就得。 */
function exportOpenTab() {
  const canvas = renderExportCanvas();
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      alert("瀏覽器阻止咗開新分頁。請允許彈出視窗之後再試，或者改用本機檔案版本嘅工具（雙擊 packaging-card-generator.html）。");
      URL.revokeObjectURL(url);
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }, "image/png");
}

/* ==================== 照片載入 ==================== */
function loadImageFile(file, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => cb(img);
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function onPhotoChosen(img) {
  state.photo = img;
  state.front = { zoom: 1, cx: 0.5, cy: 0.5 };
  // 背景卡預設保留原有構圖（zoom 1 = 盡量闊）
  state.bg = { zoom: 1, cx: 0.5, cy: 0.5 };
  state.persons = [];
  state.personsImg = null;
  state.eraseMask = null;
  state.bgClean = null;
  $("btnEditMask").disabled = true;
  $("photoDrop").classList.add("loaded");
  $("photoDropLabel").textContent = `已載入 ${img.naturalWidth} × ${img.naturalHeight}px（可重新揀相）`;
  $("btnExport").disabled = false;
  $("btnExportTab").disabled = false;

  const short = Math.min(img.naturalWidth, img.naturalHeight);
  const notice = $("photoNotice");
  if (short < 1200) {
    notice.textContent = `注意：照片短邊只有 ${short}px，300dpi 印刷可能唔夠清，建議用原相。`;
    notice.hidden = false;
  } else {
    notice.hidden = true;
  }

  if (!state.paletteManual) autoPickPalette(img);
  requestRender();
  if (!state.bgPhoto) runDetection(img);
}

function onBgPhotoChosen(img) {
  state.bgPhoto = img;
  state.bg = { zoom: 1, cx: 0.5, cy: 0.5 };
  state.persons = [];
  state.personsImg = null;
  state.eraseMask = null;
  state.bgClean = null;
  $("btnEditMask").disabled = true;
  $("bgPhotoDropLabel").textContent = `已載入背景相 ${img.naturalWidth} × ${img.naturalHeight}px`;
  requestRender();
  runDetection(img);
}

/* ==================== 自動配色 ==================== */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, sName = 0;
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d > 0) {
    sName = d / (1 - Math.abs(2 * l - 1));
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, sName, l];
}

function autoPickPalette(img) {
  const c = document.createElement("canvas");
  c.width = c.height = 40;
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0, 40, 40);
  const data = x.getImageData(0, 0, 40, 40).data;
  let r = 0, g = 0, b = 0, n = 0, satSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  r /= n; g /= n; b /= n;
  const [h, sat] = rgbToHsl(r, g, b);
  let best = PALETTES[0], bestD = Infinity;
  for (const p of PALETTES) {
    const pr = parseInt(p.light.slice(1, 3), 16),
          pg = parseInt(p.light.slice(3, 5), 16),
          pb = parseInt(p.light.slice(5, 7), 16);
    const [ph, psat] = rgbToHsl(pr, pg, pb);
    let dh = Math.abs(h - ph);
    if (dh > 180) dh = 360 - dh;
    const d = dh + Math.abs(sat - psat) * 60;
    if (d < bestD) { bestD = d; best = p; }
  }
  state.colors = { light: best.light, deep: best.deep, works: best.works };
  syncColorUI(best.id);
  $("paletteHint").textContent = `已自動揀「${best.name}」，下面三個色可以再自由調`;
}

/* ==================== 人物偵測（TensorFlow.js coco-ssd） ==================== */
function loadScript(src) {
  return new Promise((res, rej) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = res;
    el.onerror = rej;
    document.head.appendChild(el);
  });
}

/* 嵌入式模型（uint8 量化 base64）→ tfjs IOHandler，
   file:// 直開都用得，唔使網絡 */
function localHandlerFrom(m) {
  const bin = atob(m.weightsB64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return {
    load: async () => ({
      modelTopology: m.json.modelTopology,
      format: m.json.format,
      generatedBy: m.json.generatedBy,
      convertedBy: m.json.convertedBy,
      signature: m.json.signature,
      userDefinedMetadata: m.json.userDefinedMetadata,
      modelInitializer: m.json.modelInitializer,
      weightSpecs: m.json.weightsManifest[0].weights,
      weightData: buf.buffer,
    }),
  };
}

async function ensureDetector() {
  if (state.detector) return state.detector;
  if (state.detectorFailed) return null;
  // 首選：打包喺 repo 入面嘅模型（離線可用）
  try {
    setDetectNotice("正在載入人物偵測模型…");
    if (typeof tf === "undefined") await loadScript("vendor/tf.min.js");
    if (typeof cocoSsd === "undefined") await loadScript("vendor/coco-ssd.min.js");
    if (!window.__PKG_DETECTOR_MODEL) await loadScript("vendor/detector-model.js");
    state.detector = await cocoSsd.load({ modelUrl: localHandlerFrom(window.__PKG_DETECTOR_MODEL) });
    return state.detector;
  } catch (e) {
    console.warn("本地模型載入失敗，改試 CDN：", e);
  }
  // 後備：CDN（本地檔案唔齊先會行到呢度）
  try {
    if (typeof cocoSsd === "undefined") {
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
    }
    state.detector = await cocoSsd.load({ base: "lite_mobilenet_v2" });
    return state.detector;
  } catch (e) {
    state.detectorFailed = true;
    setDetectNotice("人物偵測模型載入失敗。可以用「編輯移除範圍」自己框出人物，或者揀「背景卡裁切」手動調整。");
    $("btnEditMask").disabled = false;
    const im = state.bgPhoto || state.photo;
    if (im && !state.eraseMask) state.eraseMask = new Uint8Array(imgW(im) * imgH(im));
    return null;
  }
}

/* 人物分割模型（BodyPix）：本地優先，CDN 後備 */
async function ensureSegmenter() {
  if (state.segmenter) return state.segmenter;
  if (state.segmenterFailed) return null;
  const bpLoad = () => (window.bodyPix || window["body-pix"]).load({
    architecture: "MobileNetV1", outputStride: 16, multiplier: 0.75, quantBytes: 1,
    modelUrl: localHandlerFrom(window.__BP_MODEL),
  });
  try {
    if (typeof tf === "undefined") await loadScript("vendor/tf.min.js");
    if (!(window.bodyPix || window["body-pix"])) await loadScript("vendor/body-pix.min.js");
    if (!window.__BP_MODEL) await loadScript("vendor/bp-model.js");
    state.segmenter = await bpLoad();
    return state.segmenter;
  } catch (e) {
    console.warn("本地分割模型載入失敗，改試 CDN：", e);
  }
  try {
    if (!(window.bodyPix || window["body-pix"])) {
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.2.1/dist/body-pix.min.umd.js");
    }
    state.segmenter = await (window.bodyPix || window["body-pix"]).load({
      architecture: "MobileNetV1", outputStride: 16, multiplier: 0.75, quantBytes: 1,
    });
    return state.segmenter;
  } catch (e) {
    state.segmenterFailed = true;
    return null;
  }
}

/* 自動產生「要抹走」mask：BodyPix 分割 ∩ 人物方框（外擴），再膨脹執邊 */
async function buildAutoMask(img) {
  const bp = await ensureSegmenter();
  if (!bp) return null;
  const W = imgW(img), H = imgH(img);
  const seg = await bp.segmentPerson(img, {
    internalResolution: "medium", segmentationThreshold: 0.5, maxDetections: 10,
  });
  const m = Math.min(W, H) * 0.045;
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < mask.length; i++) {
    if (!seg.data[i]) continue;
    const x = i % W, y = (i / W) | 0;
    for (const p of state.persons) {
      if (x >= p.x - m && x <= p.x + p.w + m && y >= p.y - m && y <= p.y + p.h + m) { mask[i] = 1; break; }
    }
  }
  const dil = Math.max(6, Math.round(Math.min(W, H) * 0.018));
  return window.__inpaintUtils.dilateMask(mask, W, H, dil);
}

function imgToCanvas(img) {
  const c = document.createElement("canvas");
  c.width = imgW(img); c.height = imgH(img);
  c.getContext("2d").drawImage(img, 0, 0);
  return c;
}

/* 用目前 state.eraseMask 做填補，產生乾淨版背景 */
async function runInpaint(img) {
  if (!state.eraseMask) return;
  state.eraseBusy = true;
  setDetectNotice("填補緊背景…（大相可能要十幾秒，請等等）");
  await new Promise((r) => setTimeout(r, 60)); // 畀 UI 先更新
  try {
    const cleaned = inpaintErase(imgToCanvas(img), state.eraseMask);
    state.bgClean = { src: img, canvas: cleaned };
    setDetectNotice("背景卡已移除人物。效果唔理想可以撳「編輯移除範圍」執一執。");
  } catch (e) {
    console.warn("inpaint 失敗：", e);
    state.bgClean = null;
    setDetectNotice("填補失敗，背景卡改用原相；可以試下手動裁切避開人物。");
  }
  state.eraseBusy = false;
  $("btnEditMask").disabled = false;
  $("btnRedetect").disabled = false;
  requestRender();
}

/* 主流程：偵測 → 分割 → 填補 */
async function runDetection(img) {
  const det = await ensureDetector();
  $("btnRedetect").disabled = false;
  if (!det) { requestRender(); return; }
  try {
    setDetectNotice("偵測緊人物…");
    const preds = await det.detect(img, 10, 0.4);
    state.persons = preds
      .filter((p) => p.class === "person")
      .map((p) => ({ x: p.bbox[0], y: p.bbox[1], w: p.bbox[2], h: p.bbox[3] }));
    state.personsImg = img;
    if (state.persons.length === 0) {
      setDetectNotice("偵測唔到人物，背景卡直接用原相。如果其實有人，撳「編輯移除範圍」自己框出嚟。");
      state.eraseMask = new Uint8Array(imgW(img) * imgH(img));
      $("btnEditMask").disabled = false;
      requestRender();
      return;
    }
    if (!state.eraseEnabled) {
      // 冇開移除：退返去「避開人物裁切」模式
      autoBgCrop(img);
      setDetectNotice(`偵測到 ${state.persons.length} 個人物（未開自動移除），背景卡已避開人物裁切。`);
      requestRender();
      return;
    }
    setDetectNotice("分割緊人物輪廓…");
    const mask = await buildAutoMask(img);
    if (!mask) {
      autoBgCrop(img);
      setDetectNotice("分割模型載入失敗，背景卡改為避開人物裁切；亦可以手動微調。");
      requestRender();
      return;
    }
    state.eraseMask = mask;
    await runInpaint(img);
  } catch (e) {
    console.warn(e);
    setDetectNotice("偵測過程出錯，背景卡用原相；可以手動裁切。");
  }
}

function setDetectNotice(msg) {
  const el = $("detectNotice");
  el.textContent = msg;
  el.hidden = !msg;
}

/* 畫面豐富度圖：縮細張相計梯度能量，再做 integral image 方便快速求和。
   用嚟令自動裁切唔好揀一片乜都冇嘅天空，而係揀有景物嘅背景。 */
function buildDetailMap(img) {
  const mw = 96;
  const mh = Math.max(12, Math.round(mw * img.naturalHeight / img.naturalWidth));
  const c = document.createElement("canvas");
  c.width = mw; c.height = mh;
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0, mw, mh);
  const d = x.getImageData(0, 0, mw, mh).data;
  const gray = new Float32Array(mw * mh);
  for (let i = 0; i < mw * mh; i++) {
    gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  }
  // integral image of gradient magnitude
  const integ = new Float64Array((mw + 1) * (mh + 1));
  for (let yy = 0; yy < mh; yy++) {
    let rowSum = 0;
    for (let xx = 0; xx < mw; xx++) {
      const g = gray[yy * mw + xx];
      const gx = xx + 1 < mw ? Math.abs(gray[yy * mw + xx + 1] - g) : 0;
      const gy = yy + 1 < mh ? Math.abs(gray[(yy + 1) * mw + xx] - g) : 0;
      rowSum += gx + gy;
      integ[(yy + 1) * (mw + 1) + xx + 1] = integ[yy * (mw + 1) + xx + 1] + rowSum;
    }
  }
  return {
    mw, mh,
    // 求 (x0,y0)-(x1,y1)（map 座標）內平均梯度
    mean(x0, y0, x1, y1) {
      x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
      x1 = Math.min(mw, Math.ceil(x1)); y1 = Math.min(mh, Math.ceil(y1));
      if (x1 <= x0 || y1 <= y0) return 0;
      const W1 = mw + 1;
      const s = integ[y1 * W1 + x1] - integ[y0 * W1 + x1] - integ[y1 * W1 + x0] + integ[y0 * W1 + x0];
      return s / ((x1 - x0) * (y1 - y0));
    },
  };
}

/* 喺人物範圍以外自動搵一個直向裁切窗（旋轉後啱背景卡比例）。
   人物框會先向外擴 margin，避免裁到衫腳、頭髮邊。
   所有乾淨窗口之中揀「畫面最豐富」嗰個（唔會齋裁一片天空）；
   完全乾淨嘅窗口搵唔到時，退而求其次揀重疊最少嘅位置（回傳 "partial"）。 */
function autoBgCrop(img) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const aspect = T.bg.h / T.bg.w; // 旋轉前 crop 闊高比（直向）
  const margin = Math.min(W, H) * 0.04;
  const boxes = state.persons.map((p) => ({
    x: p.x - margin, y: p.y - margin, w: p.w + margin * 2, h: p.h + margin * 2,
  }));
  const detail = buildDetailMap(img);
  const mScale = detail.mw / W;
  const overlap = (ax, ay, aw, ah, b) => {
    const ix = Math.max(0, Math.min(ax + aw, b.x + b.w) - Math.max(ax, b.x));
    const iy = Math.max(0, Math.min(ay + ah, b.y + b.h) - Math.max(ay, b.y));
    return ix * iy;
  };
  const apply = (x, y, cw, ch) => {
    const cover = Math.max(T.bg.h / W, T.bg.w / H);
    const zoom = (T.bg.h / cw) / cover;
    state.bg = {
      zoom: Math.max(1, zoom),
      cx: (x + cw / 2) / W,
      cy: (y + ch / 2) / H,
    };
  };
  let bestClean = null;
  let fallback = null; // 重疊最少嘅候補窗口
  for (let scale = 1.0; scale >= 0.249; scale -= 0.05) {
    let ch = H * scale, cw = ch * aspect;
    if (cw > W) { cw = W * scale; ch = cw / aspect; }
    if (ch > H) continue;
    const steps = 24;
    for (let iy = 0; iy <= steps; iy++) {
      for (let ix = 0; ix <= steps; ix++) {
        const x = (W - cw) * ix / steps;
        const y = (H - ch) * iy / steps;
        let ov = 0;
        for (const b of boxes) ov += overlap(x, y, cw, ch, b);
        if (ov === 0) {
          // 豐富度為主，窗口大細輕微加分
          const score = detail.mean(x * mScale, y * mScale, (x + cw) * mScale, (y + ch) * mScale)
            * Math.sqrt(scale);
          if (!bestClean || score > bestClean.score) bestClean = { x, y, cw, ch, score };
        } else {
          const frac = ov / (cw * ch) - scale * 0.1; // 輕微偏好大窗口
          if (!fallback || frac < fallback.frac) fallback = { x, y, cw, ch, frac };
        }
      }
    }
  }
  if (bestClean) {
    apply(bestClean.x, bestClean.y, bestClean.cw, bestClean.ch);
    return "clean";
  }
  if (fallback) {
    apply(fallback.x, fallback.y, fallback.cw, fallback.ch);
    return "partial";
  }
  return false;
}

/* ==================== 配色 UI ====================
   三隻色（卡底／LOGO 強調／WORKS 字色）完全自由揀；
   配色組淨係一鍵套用嘅起步值，套用之後都可以再逐隻改。 */
function syncColorUI(activeId) {
  document.querySelectorAll(".swatch").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === activeId);
  });
  $("colorLight").value = state.colors.light;
  $("colorDeep").value = state.colors.deep;
  $("colorWorks").value = state.colors.works;
}

function buildSwatches() {
  const wrap = $("swatches");
  for (const p of PALETTES) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.dataset.id = p.id;
    b.title = p.name;
    b.innerHTML = `<span class="top" style="background:${p.light}"></span><span class="bottom" style="background:${p.deep}"></span>`;
    b.addEventListener("click", () => {
      state.colors = { light: p.light, deep: p.deep, works: p.works };
      state.paletteManual = true;
      $("paletteHint").textContent = `已套用「${p.name}」，可以再逐隻色調`;
      syncColorUI(p.id);
      requestRender();
    });
    wrap.appendChild(b);
  }
  syncColorUI(PALETTES[0].id);

  for (const [inputId, key] of [["colorLight", "light"], ["colorDeep", "deep"], ["colorWorks", "works"]]) {
    $(inputId).addEventListener("input", () => {
      state.colors[key] = $(inputId).value;
      state.paletteManual = true;
      syncColorUI(null); // 自訂顏色，冇對應邊個預設組
      requestRender();
    });
  }
}

/* ==================== 拖曳 / 縮放互動 ==================== */
function canvasPt(ev) {
  const rect = previewCanvas.getBoundingClientRect();
  return {
    x: (ev.clientX - rect.left) * (previewCanvas.width / rect.width) / PS,
    y: (ev.clientY - rect.top) * (previewCanvas.height / rect.height) / PS,
  };
}

/* 主題文字嘅拖曳判定框（隨字級縮放，加少少邊界方便撳中） */
function themeBox() {
  const scale = state.theme.size / T.theme.size;
  const halfW = (T.theme.maxW * scale) / 2 + 6;
  return {
    x0: state.theme.cx - halfW, x1: state.theme.cx + halfW,
    y0: state.theme.baseline - state.theme.size * 1.05,
    y1: state.theme.baseline + state.theme.size * 0.4,
  };
}

function regionAt(pt) {
  if (pt.y >= T.die.top && pt.y <= T.photoBottom && pt.x >= T.die.left && pt.x <= T.die.right) return "front";
  const tb = themeBox();
  if (pt.x >= tb.x0 && pt.x <= tb.x1 && pt.y >= tb.y0 && pt.y <= tb.y1) return "theme";
  if (pt.y >= T.bg.y && pt.y <= T.bg.y + T.bg.h && pt.x >= T.bg.x && pt.x <= T.bg.x + T.bg.w) {
    const f = state.frame;
    const nearFrame =
      state.adjustTarget === "frame" ||
      (Math.abs(pt.x - f.x) < 6 || Math.abs(pt.x - (f.x + T.frame.w)) < 6 ||
       Math.abs(pt.y - f.y) < 6 || Math.abs(pt.y - (f.y + T.frame.h)) < 6);
    return nearFrame && state.adjustTarget === "frame" ? "frame" : "bg";
  }
  return null;
}

let drag = null;
previewCanvas.addEventListener("pointerdown", (ev) => {
  const pt = canvasPt(ev);
  const region = regionAt(pt);
  if (!region) return;
  setAdjustTarget(region === "frame" ? "frame" : region);
  drag = { start: pt, front: { ...state.front }, bg: { ...state.bg }, frame: { ...state.frame }, theme: { ...state.theme }, region };
  previewCanvas.setPointerCapture(ev.pointerId);
  previewCanvas.classList.add("grabbing");
});

previewCanvas.addEventListener("pointermove", (ev) => {
  if (!drag) {
    previewCanvas.classList.toggle("grabbable", !!regionAt(canvasPt(ev)));
    return;
  }
  const pt = canvasPt(ev);
  const dx = pt.x - drag.start.x, dy = pt.y - drag.start.y;
  if (drag.region === "front" && state.photo) {
    const img = state.photo;
    const dw = T.die.right - T.die.left, dh = T.photoBottom - T.die.top;
    const c = computeCrop(img, drag.front, dw, dh);
    const scale = c.sw / dw; // pt → 相片 px
    state.front.cx = drag.front.cx - (dx * scale) / imgW(img);
    state.front.cy = drag.front.cy - (dy * scale) / imgH(img);
    clampView(state.front, img, dw, dh);
  } else if (drag.region === "bg") {
    const img = state.bgPhoto || state.photo;
    if (!img) return;
    const c = computeCrop(img, drag.bg, T.bg.h, T.bg.w);
    const scale = c.sw / T.bg.h;
    // 旋轉咗 90°：頁面 x 對應相片 y（反向），頁面 y 對應相片 x
    state.bg.cx = drag.bg.cx - (dy * scale) / imgW(img);
    state.bg.cy = drag.bg.cy + (dx * scale) / imgH(img);
    clampView(state.bg, img, T.bg.h, T.bg.w);
  } else if (drag.region === "frame") {
    state.frame.x = Math.min(T.bg.x + T.bg.w - T.frame.w, Math.max(T.bg.x, drag.frame.x + dx));
    state.frame.y = Math.min(T.bg.y + T.bg.h - T.frame.h, Math.max(T.bg.y, drag.frame.y + dy));
  } else if (drag.region === "theme") {
    // 限喺正面卡下半資訊區內拖，唔會拖出張卡去
    state.theme.cx = Math.min(T.sheet.x + T.sheet.w - 12, Math.max(T.sheet.x + 12, drag.theme.cx + dx));
    state.theme.baseline = Math.min(T.die.bottom - 6, Math.max(T.photoBottom + 12, drag.theme.baseline + dy));
  }
  requestRender();
});

function endDrag(ev) {
  drag = null;
  previewCanvas.classList.remove("grabbing");
}
previewCanvas.addEventListener("pointerup", endDrag);
previewCanvas.addEventListener("pointercancel", endDrag);

function clampView(view, img, dw, dh) {
  view.zoom = Math.max(1, Math.min(4.5, view.zoom));
  const c = computeCrop(img, view, dw, dh);
  view.cx = (c.sx + c.sw / 2) / imgW(img);
  view.cy = (c.sy + c.sh / 2) / imgH(img);
}

previewCanvas.addEventListener("wheel", (ev) => {
  const pt = canvasPt(ev);
  const region = regionAt(pt);
  if (!region || region === "frame") return;
  ev.preventDefault();
  if (region === "theme") {
    state.theme.size = Math.max(4, Math.min(28, state.theme.size * (ev.deltaY < 0 ? 1.06 : 0.94)));
    setAdjustTarget("theme");
    syncZoomSlider();
    requestRender();
    return;
  }
  const view = region === "front" ? state.front : state.bg;
  const img = region === "front" ? state.photo : (state.bgPhoto || state.photo);
  if (!img) return;
  view.zoom *= ev.deltaY < 0 ? 1.06 : 0.94;
  const [dw, dh] = region === "front"
    ? [T.die.right - T.die.left, T.photoBottom - T.die.top]
    : [T.bg.h, T.bg.w];
  clampView(view, img, dw, dh);
  setAdjustTarget(region);
  syncZoomSlider();
  requestRender();
}, { passive: false });

const ADJUST_HINTS = {
  front: "直接喺預覽圖上拖曳移動；滾輪都可以縮放",
  bg: "背景卡預設 100% 縮放係啱啱好完整顯示成張相、冇裁走任何嘢，所以呢個縮放度之下冇位拖郁。想左右上下移動，先滾輪（或拉右邊嘅縮放滑桿）放大少少，之後就可以好似正面相片咁自由拖曳",
  frame: "直接喺預覽圖上拖曳內框位置（呢個唔涉及縮放）",
  theme: "直接喺右下角主題文字度拖曳移動位置；滾輪或者右邊嘅字級滑桿可以調大細",
};

function setAdjustTarget(t) {
  state.adjustTarget = t;
  $("segFront").classList.toggle("active", t === "front");
  $("segBg").classList.toggle("active", t === "bg");
  $("segFrame").classList.toggle("active", t === "frame");
  $("segTheme").classList.toggle("active", t === "theme");
  $("zoomSlider").disabled = t === "frame";
  if (t === "theme") {
    $("zoomSlider").min = 40;
    $("zoomSlider").max = 280;
    $("zoomLabelText").textContent = "字級";
  } else {
    $("zoomSlider").min = 100;
    $("zoomSlider").max = 450;
    $("zoomLabelText").textContent = "縮放";
  }
  $("adjustHint").textContent = ADJUST_HINTS[t];
  syncZoomSlider();
  requestRender();
}

function syncZoomSlider() {
  if (state.adjustTarget === "theme") {
    $("zoomSlider").value = Math.round((state.theme.size / T.theme.size) * 100);
    return;
  }
  const view = state.adjustTarget === "front" ? state.front : state.bg;
  $("zoomSlider").value = Math.round(view.zoom * 100);
}

/* ==================== 移除範圍筆刷編輯器 ==================== */
const maskEditor = {
  img: null,       // 編輯緊嘅背景相
  maskCanvas: null, // 相片解像度嘅 mask（紅色 = 移除）
  viewScale: 1,
  brushMode: "add",
  painting: false,
};

function openMaskEditor() {
  const img = state.bgPhoto || state.photo;
  if (!img) return;
  const W = imgW(img), H = imgH(img);
  maskEditor.img = img;

  // mask canvas（相片解像度），由目前 eraseMask 初始化
  const mc = document.createElement("canvas");
  mc.width = W; mc.height = H;
  const mctx = mc.getContext("2d");
  if (state.eraseMask && state.eraseMask.length === W * H) {
    const id = mctx.createImageData(W, H);
    for (let i = 0; i < state.eraseMask.length; i++) {
      if (state.eraseMask[i]) {
        id.data[i * 4] = 255; id.data[i * 4 + 3] = 255;
      }
    }
    mctx.putImageData(id, 0, 0);
  }
  maskEditor.maskCanvas = mc;

  // 顯示 canvas fit 屏幕
  const view = $("maskCanvas");
  const maxW = Math.min(window.innerWidth * 0.86, 900);
  const maxH = window.innerHeight * 0.58;
  maskEditor.viewScale = Math.min(maxW / W, maxH / H, 1);
  view.width = Math.round(W * maskEditor.viewScale);
  view.height = Math.round(H * maskEditor.viewScale);
  redrawMaskEditor();
  $("maskModal").hidden = false;
}

function redrawMaskEditor() {
  const view = $("maskCanvas");
  const ctx = view.getContext("2d");
  ctx.clearRect(0, 0, view.width, view.height);
  ctx.drawImage(maskEditor.img, 0, 0, view.width, view.height);
  ctx.globalAlpha = 0.45;
  ctx.drawImage(maskEditor.maskCanvas, 0, 0, view.width, view.height);
  ctx.globalAlpha = 1;
}

function maskEditorPaint(ev) {
  const view = $("maskCanvas");
  const rect = view.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (view.width / rect.width) / maskEditor.viewScale;
  const y = (ev.clientY - rect.top) * (view.height / rect.height) / maskEditor.viewScale;
  const r = Number($("brushSize").value) / maskEditor.viewScale;
  const ctx = maskEditor.maskCanvas.getContext("2d");
  ctx.globalCompositeOperation = maskEditor.brushMode === "add" ? "source-over" : "destination-out";
  ctx.fillStyle = "rgb(255,0,0)";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  redrawMaskEditor();
}

async function applyMaskEditor() {
  const img = maskEditor.img;
  const W = imgW(img), H = imgH(img);
  const data = maskEditor.maskCanvas.getContext("2d").getImageData(0, 0, W, H).data;
  const mask = new Uint8Array(W * H);
  let any = 0;
  for (let i = 0; i < mask.length; i++) {
    if (data[i * 4 + 3] > 40) { mask[i] = 1; any = 1; }
  }
  state.eraseMask = mask;
  $("maskModal").hidden = true;
  if (!any) {
    state.bgClean = null;
    setDetectNotice("移除範圍係空嘅，背景卡用原相。");
    requestRender();
    return;
  }
  await runInpaint(img);
}

/* ==================== 暫存資料（localStorage，唔含相片） ==================== */
const DRAFT_KEY = "moment-lab-packaging-card-draft-v1";

function collectDraft() {
  return {
    code: $("fldCode").value,
    nameEn: $("fldNameEn").value,
    nameJp: $("fldNameJp").value,
    theme: $("fldTheme").value,
    qr: $("fldQr").value,
    website: $("fldWebsite").value,
    colors: { ...state.colors },
    paletteManual: state.paletteManual,
    nameJpAuto: state.nameJpAuto,
    eraseEnabled: state.eraseEnabled,
    themeLayout: { ...state.theme },
  };
}

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft()));
    const t = new Date();
    const hh = String(t.getHours()).padStart(2, "0"), mm = String(t.getMinutes()).padStart(2, "0");
    $("draftHint").textContent = `已於 ${hh}:${mm} 暫存喺呢部機（相片唔會暫存，下次要重新上載）`;
  } catch (e) {
    $("draftHint").textContent = "暫存失敗——呢個瀏覽器可能唔支援，或者用緊私密瀏覽模式。";
  }
}

function restoreDraft() {
  let raw;
  try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) { return; }
  if (!raw) return;
  let d;
  try { d = JSON.parse(raw); } catch (e) { return; }
  if (d.code != null) $("fldCode").value = d.code;
  if (d.nameEn != null) $("fldNameEn").value = d.nameEn;
  if (d.nameJp != null) $("fldNameJp").value = d.nameJp;
  if (d.theme != null) $("fldTheme").value = d.theme;
  if (d.qr != null) $("fldQr").value = d.qr;
  if (d.website != null) $("fldWebsite").value = d.website;
  if (d.colors) state.colors = { ...state.colors, ...d.colors };
  if (typeof d.paletteManual === "boolean") state.paletteManual = d.paletteManual;
  if (typeof d.nameJpAuto === "boolean") state.nameJpAuto = d.nameJpAuto;
  if (typeof d.eraseEnabled === "boolean") {
    state.eraseEnabled = d.eraseEnabled;
    $("chkErase").checked = d.eraseEnabled;
  }
  if (d.themeLayout) state.theme = { ...state.theme, ...d.themeLayout };
  syncColorUI(null);
  $("draftHint").textContent = "已帶返上次暫存嘅資料（相片要重新上載）。";
}

/* ==================== 事件綁定 ==================== */
function bindFileDrop(dropEl, inputEl, handler) {
  inputEl.addEventListener("change", () => {
    if (inputEl.files[0]) loadImageFile(inputEl.files[0], handler);
  });
  dropEl.addEventListener("dragover", (e) => { e.preventDefault(); dropEl.classList.add("dragover"); });
  dropEl.addEventListener("dragleave", () => dropEl.classList.remove("dragover"));
  dropEl.addEventListener("drop", (e) => {
    e.preventDefault();
    dropEl.classList.remove("dragover");
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) loadImageFile(f, handler);
  });
}

function init() {
  buildSwatches();
  restoreDraft();
  bindFileDrop($("photoDrop"), $("photoInput"), onPhotoChosen);
  bindFileDrop($("bgPhotoDetails"), $("bgPhotoInput"), onBgPhotoChosen);

  for (const id of ["fldCode", "fldTheme", "fldQr", "fldWebsite"]) {
    $(id).addEventListener("input", requestRender);
  }

  // 日文行跟住英文行自動產生近似拼音；一旦手動改過日文行就唔會再蓋過，
  // 撳 🔄 可以放棄手動內容、重新自動產生
  $("fldNameEn").addEventListener("input", () => {
    if (state.nameJpAuto) $("fldNameJp").value = englishToKatakana($("fldNameEn").value);
    requestRender();
  });
  $("fldNameJp").addEventListener("input", () => {
    state.nameJpAuto = false;
    requestRender();
  });
  $("btnRetranslit").addEventListener("click", () => {
    state.nameJpAuto = true;
    $("fldNameJp").value = englishToKatakana($("fldNameEn").value);
    requestRender();
  });

  $("btnSaveDraft").addEventListener("click", saveDraft);

  $("segFront").addEventListener("click", () => setAdjustTarget("front"));
  $("segBg").addEventListener("click", () => setAdjustTarget("bg"));
  $("segFrame").addEventListener("click", () => setAdjustTarget("frame"));
  $("segTheme").addEventListener("click", () => setAdjustTarget("theme"));

  $("zoomSlider").addEventListener("input", () => {
    if (state.adjustTarget === "theme") {
      state.theme.size = T.theme.size * ($("zoomSlider").value / 100);
      requestRender();
      return;
    }
    const view = state.adjustTarget === "front" ? state.front : state.bg;
    const img = state.adjustTarget === "front" ? state.photo : (state.bgPhoto || state.photo);
    if (!img) return;
    view.zoom = $("zoomSlider").value / 100;
    const [dw, dh] = state.adjustTarget === "front"
      ? [T.die.right - T.die.left, T.photoBottom - T.die.top]
      : [T.bg.h, T.bg.w];
    clampView(view, img, dw, dh);
    requestRender();
  });

  $("btnRedetect").addEventListener("click", () => {
    const img = state.bgPhoto || state.photo;
    if (!img || state.eraseBusy) return;
    state.bgClean = null;
    state.eraseMask = null;
    runDetection(img);
  });

  // 人物移除開關（預設關閉；開返嘅時候先真正跑分割＋填補）
  $("chkErase").addEventListener("change", async () => {
    if (state.eraseBusy) { $("chkErase").checked = state.eraseEnabled; return; }
    state.eraseEnabled = $("chkErase").checked;
    const img = state.bgPhoto || state.photo;
    if (!img) { requestRender(); return; }
    if (!state.eraseEnabled) {
      $("btnEditMask").disabled = true;
      requestRender();
      return;
    }
    if (state.bgClean && state.bgClean.src === img) {
      requestRender(); // 之前已經填補過，直接顯示
      return;
    }
    $("chkErase").disabled = true;
    setDetectNotice("分割緊人物輪廓…");
    const mask = await buildAutoMask(img);
    $("chkErase").disabled = false;
    if (!mask) {
      setDetectNotice("分割模型載入失敗，已還原做避開人物裁切模式。");
      state.eraseEnabled = false;
      $("chkErase").checked = false;
      requestRender();
      return;
    }
    state.eraseMask = mask;
    await runInpaint(img);
  });

  // mask 筆刷編輯器
  $("btnEditMask").addEventListener("click", () => {
    if (!state.eraseBusy) openMaskEditor();
  });
  $("maskCancel").addEventListener("click", () => { $("maskModal").hidden = true; });
  $("maskApply").addEventListener("click", applyMaskEditor);
  $("brushAdd").addEventListener("click", () => {
    maskEditor.brushMode = "add";
    $("brushAdd").classList.add("active");
    $("brushSub").classList.remove("active");
  });
  $("brushSub").addEventListener("click", () => {
    maskEditor.brushMode = "sub";
    $("brushSub").classList.add("active");
    $("brushAdd").classList.remove("active");
  });
  const mcv = $("maskCanvas");
  mcv.addEventListener("pointerdown", (ev) => {
    maskEditor.painting = true;
    mcv.setPointerCapture(ev.pointerId);
    maskEditorPaint(ev);
  });
  mcv.addEventListener("pointermove", (ev) => {
    if (maskEditor.painting) maskEditorPaint(ev);
  });
  mcv.addEventListener("pointerup", () => { maskEditor.painting = false; });
  mcv.addEventListener("pointercancel", () => { maskEditor.painting = false; });

  $("btnExport").addEventListener("click", exportPng);
  $("btnExportTab").addEventListener("click", exportOpenTab);

  // 字體載入完成後重繪，確保預覽用啱字體
  if (document.fonts && document.fonts.ready) {
    const families = [
      '700 20px Quicksand', '20px Shrikhand', '20px Montserrat',
      '500 20px Montserrat', '20px "Noto Sans"', '20px "Noto Sans TC"', '700 20px "Noto Sans TC"',
    ];
    Promise.all(families.map((f) => document.fonts.load(f, "測試Aa0"))).then(requestRender);
    document.fonts.ready.then(requestRender);
  }
  requestRender();
}

init();
