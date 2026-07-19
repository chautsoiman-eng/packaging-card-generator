/* ============================================================
   圖像修補（inpainting）— 將人物範圍用周圍背景填返
   多尺度 PatchMatch（Barnes et al. 2009 + Wexler voting）純 JS 實現，
   全程喺瀏覽器本機運行，唔使網絡。

   用法：
     const cleaned = inpaintErase(imgCanvas, maskU8, w, h, onProgress)
     → 回傳同尺寸嘅 canvas，mask=1 嘅位置已用背景填補
   ============================================================ */

(function () {
  "use strict";

  const PATCH_R = 3;          // 7×7 patch
  const EM_ITERS = 3;         // 每層 EM 次數
  const PM_ITERS = 5;         // 每次 EM 入面 PatchMatch 掃描次數
  const WORK_MAX = 1100;      // 修補運算長邊上限（之後只將填補位升返原尺寸）
  const COARSE_MIN = 96;      // 金字塔最粗一層嘅長邊（太粗會令大洞塌落單一平色）
  // 隨機搜尋垂直範圍壓細：呢類背景（海平線、欄杆、天空帶）結構多數係橫向，
  // 優先喺同一水平帶搵相似 patch，填出嚟先會延續到橫向結構
  const V_BIAS = 6;           // dy 範圍 = rad / V_BIAS
  const ROW_PRIOR = 260000;   // 同 row 先驗強度（相對垂直偏移平方嘅懲罰）

  /* ---------- 基本工具 ---------- */

  function downscaleRGBA(src, sw, sh, dw, dh) {
    // box filter 縮圖（簡單夠用）
    const dst = new Uint8ClampedArray(dw * dh * 4);
    const xr = sw / dw, yr = sh / dh;
    for (let y = 0; y < dh; y++) {
      const y0 = Math.floor(y * yr), y1 = Math.min(sh, Math.max(y0 + 1, Math.floor((y + 1) * yr)));
      for (let x = 0; x < dw; x++) {
        const x0 = Math.floor(x * xr), x1 = Math.min(sw, Math.max(x0 + 1, Math.floor((x + 1) * xr)));
        let r = 0, g = 0, b = 0, n = 0;
        for (let yy = y0; yy < y1; yy++) {
          for (let xx = x0; xx < x1; xx++) {
            const i = (yy * sw + xx) * 4;
            r += src[i]; g += src[i + 1]; b += src[i + 2]; n++;
          }
        }
        const o = (y * dw + x) * 4;
        dst[o] = r / n; dst[o + 1] = g / n; dst[o + 2] = b / n; dst[o + 3] = 255;
      }
    }
    return dst;
  }

  function downscaleMask(mask, sw, sh, dw, dh) {
    // 有一個子像素係 hole 就當 hole，避免 hole 邊界滲入嚟源
    const dst = new Uint8Array(dw * dh);
    const xr = sw / dw, yr = sh / dh;
    for (let y = 0; y < dh; y++) {
      const y0 = Math.floor(y * yr), y1 = Math.min(sh, Math.max(y0 + 1, Math.floor((y + 1) * yr)));
      for (let x = 0; x < dw; x++) {
        const x0 = Math.floor(x * xr), x1 = Math.min(sw, Math.max(x0 + 1, Math.floor((x + 1) * xr)));
        let m = 0;
        for (let yy = y0; yy < y1 && !m; yy++) {
          for (let xx = x0; xx < x1; xx++) {
            if (mask[yy * sw + xx]) { m = 1; break; }
          }
        }
        dst[y * dw + x] = m;
      }
    }
    return dst;
  }

  /* mask=1 區域向外擴 r 像素（方形膨脹，兩次一維掃快過二維） */
  function dilateMask(mask, w, h, r) {
    if (r <= 0) return mask.slice();
    const tmp = new Uint8Array(w * h);
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      let cnt = 0;
      for (let x = -r; x < w; x++) {
        if (x + r < w && mask[y * w + x + r]) cnt++;
        if (x - r - 1 >= 0 && mask[y * w + x - r - 1]) cnt--;
        if (x >= 0) tmp[y * w + x] = cnt > 0 ? 1 : 0;
      }
    }
    for (let x = 0; x < w; x++) {
      let cnt = 0;
      for (let y = -r; y < h; y++) {
        if (y + r < h && tmp[(y + r) * w + x]) cnt++;
        if (y - r - 1 >= 0 && tmp[(y - r - 1) * w + x]) cnt--;
        if (y >= 0) out[y * w + x] = cnt > 0 ? 1 : 0;
      }
    }
    return out;
  }

  /* 洋蔥式擴散填充：畀最粗一層做初始值 */
  function diffusionFill(img, mask, w, h) {
    const filled = mask.slice();
    let remaining = 0;
    for (let i = 0; i < filled.length; i++) if (filled[i]) remaining++;
    let guard = 0;
    while (remaining > 0 && guard++ < 4 * (w + h)) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (!filled[i]) continue;
          let r = 0, g = 0, b = 0, n = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const xx = x + dx, yy = y + dy;
              if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
              const j = yy * w + xx;
              if (!filled[j]) {
                const o = j * 4;
                r += img[o]; g += img[o + 1]; b += img[o + 2]; n++;
              }
            }
          }
          if (n >= 2) {
            const o = i * 4;
            img[o] = r / n; img[o + 1] = g / n; img[o + 2] = b / n;
            filled[i] = 2; // 呢一輪填咗，下一輪先算已知
          }
        }
      }
      for (let i = 0; i < filled.length; i++) {
        if (filled[i] === 2) { filled[i] = 0; remaining--; }
      }
    }
  }

  /* 有效來源圖：同 hole 保持 PATCH_R 距離嘅已知像素先可以做 patch 中心 */
  function buildValidSource(mask, w, h) {
    const grown = dilateMask(mask, w, h, PATCH_R);
    const valid = new Uint8Array(w * h);
    for (let i = 0; i < valid.length; i++) valid[i] = grown[i] ? 0 : 1;
    // patch 中心唔可以太貼圖邊
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x < PATCH_R || y < PATCH_R || x >= w - PATCH_R || y >= h - PATCH_R) valid[y * w + x] = 0;
      }
    }
    return valid;
  }

  function patchDist(img, w, h, ax, ay, bx, by, best) {
    // 同 row 先驗：來源同目標垂直距離愈遠，加愈多懲罰
    // （海平線／欄杆／天空帶呢類背景，同一水平帶先似樣）
    const rel = (by - ay) / h;
    let d = ROW_PRIOR * rel * rel;
    if (d >= best) return d;
    for (let dy = -PATCH_R; dy <= PATCH_R; dy++) {
      const ayy = ay + dy, byy = by + dy;
      if (ayy < 0 || ayy >= h) continue;
      let ao = (ayy * w + ax - PATCH_R) * 4;
      let bo = (byy * w + bx - PATCH_R) * 4;
      for (let dx = -PATCH_R; dx <= PATCH_R; dx++, ao += 4, bo += 4) {
        const axx = ax + dx;
        if (axx < 0 || axx >= w) continue;
        const dr = img[ao] - img[bo], dg = img[ao + 1] - img[bo + 1], db = img[ao + 2] - img[bo + 2];
        d += dr * dr + dg * dg + db * db;
      }
      if (d >= best) return d;
    }
    return d;
  }

  /* 一層嘅 PatchMatch EM。voteFirst = 開始前先用現有 NNF 重建 hole 顏色
     （粗層用逐行初始化嘅結果着色，避免擴散填充嘅平色污染距離度量） */
  function solveLevel(img, mask, w, h, nnf, rng, voteFirst) {
    const valid = buildValidSource(mask, w, h);
    // hole 像素清單
    const holes = [];
    for (let i = 0; i < mask.length; i++) if (mask[i]) holes.push(i);
    if (!holes.length) return;

    // 初始 NNF：同一行最近嘅有效像素（延續橫向結構），冇就隨機
    const validList = [];
    for (let i = 0; i < valid.length; i++) if (valid[i]) validList.push(i);
    if (!validList.length) return;
    for (const i of holes) {
      if (nnf[i] >= 0 && valid[nnf[i]]) continue;
      const x = i % w, y = (i / w) | 0;
      let found = -1;
      for (let d = 1; d < w; d++) {
        if (x - d >= 0 && valid[y * w + x - d]) { found = y * w + x - d; break; }
        if (x + d < w && valid[y * w + x + d]) { found = y * w + x + d; break; }
      }
      nnf[i] = found >= 0 ? found : validList[(rng() * validList.length) | 0];
    }

    const maxRad = Math.max(w, h);

    // --- voting 重建（每個 hole 像素 = 覆蓋佢嘅 patch 對應像素平均） ---
    const holeIdx = new Int32Array(w * h).fill(-1);
    for (let k = 0; k < holes.length; k++) holeIdx[holes[k]] = k;
    const vote = () => {
      const accR = new Float32Array(holes.length);
      const accG = new Float32Array(holes.length);
      const accB = new Float32Array(holes.length);
      const accN = new Float32Array(holes.length);
      for (let k = 0; k < holes.length; k++) {
        const i = holes[k];
        const x = i % w, y = (i / w) | 0;
        const q = nnf[i], qx = q % w, qy = (q / w) | 0;
        for (let dy = -PATCH_R; dy <= PATCH_R; dy++) {
          for (let dx = -PATCH_R; dx <= PATCH_R; dx++) {
            const px = x + dx, py = y + dy;
            if (px < 0 || py < 0 || px >= w || py >= h) continue;
            const hk = holeIdx[py * w + px];
            if (hk < 0) continue;
            const sx = qx + dx, sy = qy + dy;
            if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
            const so = (sy * w + sx) * 4;
            accR[hk] += img[so]; accG[hk] += img[so + 1]; accB[hk] += img[so + 2]; accN[hk]++;
          }
        }
      }
      for (let k = 0; k < holes.length; k++) {
        if (!accN[k]) continue;
        const o = holes[k] * 4;
        img[o] = accR[k] / accN[k];
        img[o + 1] = accG[k] / accN[k];
        img[o + 2] = accB[k] / accN[k];
      }
    };

    if (voteFirst) vote();

    for (let em = 0; em < EM_ITERS; em++) {
      // --- PatchMatch：propagation + random search ---
      for (let it = 0; it < PM_ITERS; it++) {
        const rev = it % 2 === 1;
        for (let k = 0; k < holes.length; k++) {
          const i = holes[rev ? holes.length - 1 - k : k];
          const x = i % w, y = (i / w) | 0;
          let bi = nnf[i];
          let bd = patchDist(img, w, h, x, y, bi % w, (bi / w) | 0, Infinity);
          const step = rev ? -1 : 1;
          // propagation（左/右、上/下鄰居嘅對應再偏移）
          for (const [nx, ny, ox, oy] of [[x - step, y, step, 0], [x, y - step, 0, step]]) {
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const cand = nnf[ny * w + nx];
            if (cand < 0) continue;
            const cx = cand % w + ox, cy = ((cand / w) | 0) + oy;
            if (cx < PATCH_R || cy < PATCH_R || cx >= w - PATCH_R || cy >= h - PATCH_R) continue;
            const cj = cy * w + cx;
            if (!valid[cj]) continue;
            const d = patchDist(img, w, h, x, y, cx, cy, bd);
            if (d < bd) { bd = d; bi = cj; }
          }
          // random search：一半圍住目前最佳匹配（標準 PatchMatch），
          // 一半圍住目標像素本身嘅位置（背景多數喺附近、同一水平帶），
          // 垂直範圍壓細以延續橫向結構
          for (let rad = maxRad; rad >= 1; rad = (rad / 2) | 0) {
            for (let c = 0; c < 2; c++) {
              const ox = c === 0 ? bi % w : x;
              const oy = c === 0 ? (bi / w) | 0 : y;
              const vRad = Math.max(3, (rad / V_BIAS) | 0);
              const cx = ox + ((rng() * 2 - 1) * rad) | 0;
              const cy = oy + ((rng() * 2 - 1) * vRad) | 0;
              if (cx < PATCH_R || cy < PATCH_R || cx >= w - PATCH_R || cy >= h - PATCH_R) continue;
              const cj = cy * w + cx;
              if (!valid[cj]) continue;
              const d = patchDist(img, w, h, x, y, cx, cy, bd);
              if (d < bd) { bd = d; bi = cj; }
            }
          }
          nnf[i] = bi;
        }
      }
      vote();
    }
  }

  /* NNF 升級到下一層（座標 ×2） */
  function upsampleNNF(nnf, sw, sh, dw, dh, dMask) {
    const out = new Int32Array(dw * dh).fill(-1);
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const i = y * dw + x;
        if (!dMask[i]) continue;
        const sx = Math.min(sw - 1, x >> 1), sy = Math.min(sh - 1, y >> 1);
        const q = nnf[sy * sw + sx];
        if (q < 0) continue;
        const qx = Math.min(dw - 1, (q % sw) * 2 + (x & 1));
        const qy = Math.min(dh - 1, ((q / sw) | 0) * 2 + (y & 1));
        out[i] = qy * dw + qx;
      }
    }
    return out;
  }

  // 簡單可重現隨機數
  function makeRng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /**
   * 主入口。
   * @param srcCanvas 原相 canvas（原尺寸）
   * @param maskFull  Uint8Array(w*h)，1 = 要抹走嘅位置（原尺寸）
   * @returns 同原尺寸 canvas，mask 位置已填補
   */
  function inpaintErase(srcCanvas, maskFull) {
    const W = srcCanvas.width, H = srcCanvas.height;

    // 運算尺寸
    const workScale = Math.min(1, WORK_MAX / Math.max(W, H));
    const ww = Math.max(2, Math.round(W * workScale));
    const wh = Math.max(2, Math.round(H * workScale));

    const wc = document.createElement("canvas");
    wc.width = ww; wc.height = wh;
    const wctx = wc.getContext("2d");
    wctx.drawImage(srcCanvas, 0, 0, ww, wh);
    const workData = wctx.getImageData(0, 0, ww, wh);
    const workMask = downscaleMask(maskFull, W, H, ww, wh);

    // 金字塔
    const levels = [{ img: workData.data, mask: workMask, w: ww, h: wh }];
    while (Math.max(levels[0].w, levels[0].h) > COARSE_MIN * 2) {
      const p = levels[0];
      const nw = Math.max(2, p.w >> 1), nh = Math.max(2, p.h >> 1);
      levels.unshift({
        img: downscaleRGBA(p.img, p.w, p.h, nw, nh),
        mask: downscaleMask(p.mask, p.w, p.h, nw, nh),
        w: nw, h: nh,
      });
    }

    const rng = makeRng(1234567);
    let nnf = new Int32Array(levels[0].w * levels[0].h).fill(-1);
    for (let li = 0; li < levels.length; li++) {
      const L = levels[li];
      if (li > 0) {
        const P = levels[li - 1];
        nnf = upsampleNNF(nnf, P.w, P.h, L.w, L.h, L.mask);
        // 用上一層結果初始化呢層 hole 顏色
        const up = downscaleRGBA(P.img, P.w, P.h, L.w, L.h); // 其實係升 scale，box filter 反向都畀到近似
        for (let i = 0; i < L.mask.length; i++) {
          if (L.mask[i]) {
            L.img[i * 4] = up[i * 4]; L.img[i * 4 + 1] = up[i * 4 + 1]; L.img[i * 4 + 2] = up[i * 4 + 2];
          }
        }
      }
      // 最粗一層：先用逐行初始化嘅 NNF 重建顏色（唔用擴散填充）
      solveLevel(L.img, L.mask, L.w, L.h, nnf, rng, li === 0);
    }

    // 將 work 尺寸結果升返原尺寸，只覆蓋 mask 位置（邊界羽化 2px）
    wctx.putImageData(workData, 0, 0);
    const out = document.createElement("canvas");
    out.width = W; out.height = H;
    const octx = out.getContext("2d");
    octx.drawImage(srcCanvas, 0, 0);

    const soft = dilateMask(maskFull, W, H, 2);
    const filledFull = document.createElement("canvas");
    filledFull.width = W; filledFull.height = H;
    const fctx = filledFull.getContext("2d");
    fctx.imageSmoothingEnabled = true;
    fctx.imageSmoothingQuality = "high";
    fctx.drawImage(wc, 0, 0, W, H);
    const fd = fctx.getImageData(0, 0, W, H);
    const od = octx.getImageData(0, 0, W, H);
    for (let i = 0; i < soft.length; i++) {
      if (soft[i]) {
        od.data[i * 4] = fd.data[i * 4];
        od.data[i * 4 + 1] = fd.data[i * 4 + 1];
        od.data[i * 4 + 2] = fd.data[i * 4 + 2];
      }
    }
    octx.putImageData(od, 0, 0);
    return out;
  }

  window.inpaintErase = inpaintErase;
  window.__inpaintUtils = { dilateMask };
})();
