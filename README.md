# 公仔包裝卡產生工具

Moment Lab 內部自用工具：上載客戶相、填資料，一鍵產生 A4 300dpi 印刷用嘅
包裝卡成品圖。**照片全程喺你部機／瀏覽器本機處理，唔會上傳去任何伺服器**——
包括呢個工具打包咗做網頁之後都係咁，運算全部發生喺你嗰邊嘅瀏覽器入面。

## 用法

兩種方式擇一：

1. **網頁版**（如果已開咗 GitHub Pages）：直接開
   `https://chautsoiman-eng.github.io/packaging-card-generator/`
2. **本機檔案**：落載呢個 repo（Code → Download ZIP），解壓後雙擊
   `packaging-card-generator.html`，唔使裝任何嘢、唔使起 server

## 功能

- 版面係由原 Canva 樣板匯出 PDF 逐一量度復刻（A4，595.5 × 842.25 pt）
- 匯出 A4 300dpi PNG（2480 × 3508 px），可以直接印，或者拉入 Canva 做底圖微調
- 人物偵測用瀏覽器端 TensorFlow.js coco-ssd；模型已量化打包喺
  `vendor/detector-model.js`（約 6MB），完全離線可用，照片資料唔會離開本機
- 背景卡人物移除（預設關閉，需要先自己勾開）：**保留原有構圖、擦走人物**
  ——人物輪廓分割（BodyPix）＋ PatchMatch 背景填補（`packaging-card-inpaint.js`，
  純 JS）。自動範圍唔啱可以用「編輯移除範圍」筆刷加減再重新填補
- 固定文字（警語、材質、公司資訊）集中喺 `packaging-card-generator.js`
  開頭嘅「固定內容設定區」，要改字直接改嗰度
- 配色完全自由：卡底色／LOGO 強調色／WORKS 字色三個獨立色選器，5 組預設
  淨係一鍵起步值，套用之後照樣可以逐隻再調
- 右下角主題／行程名文字可以自由拖曳位置、調字級大細
- 日文行會跟住英文行自動產生近似片假名拼音（`packaging-card-translit.js`，
  純規則式轉寫，唔靠翻譯服務／唔使網絡；效果僅供草稿，記得自行校對）
- 「暫存目前資料」會將輸入欄位＋配色存喺瀏覽器 localStorage，下次打開
  自動帶返出嚟（相片本身唔會暫存）
- 「下載成品 PNG」用唔到（例如喺有安全限制嘅網頁框架入面睇）嘅話，
  改用「在新分頁開啟成品圖」，喺新分頁右鍵另存

## 開啟 GitHub Pages（一次性設定）

1. 呢個 repo 嘅 **Settings → Pages**
2. **Build and deployment → Source** 揀 **Deploy from a branch**
3. **Branch** 揀 `main` / `(root)`，撳 **Save**
4. 等一兩分鐘，網址會係 `https://chautsoiman-eng.github.io/packaging-card-generator/`

## 第三方資源授權

- `fonts/` — Quicksand、Shrikhand、Montserrat、Noto Sans、Noto Sans TC
  （Noto Sans TC 已子集化淨返會用到嘅字符），全部 [SIL Open Font License 1.1](https://openfontlicense.org/)，
  來源 [Google Fonts](https://fonts.google.com/)
- `vendor/qrcode.js` — [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)
  by Kazuhiko Arase，MIT License
- `vendor/tf.min.js`、`vendor/coco-ssd.min.js`、`vendor/detector-model.js`
  — TensorFlow.js 及 coco-ssd（ssdlite + lite_mobilenet_v2 模型，
  已量化 uint8 嵌入），Apache License 2.0
- `vendor/body-pix.min.js`、`vendor/bp-model.js` — BodyPix 人物分割
  （MobileNetV1 0.75 quant1 模型嵌入），Apache License 2.0
