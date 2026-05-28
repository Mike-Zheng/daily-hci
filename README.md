# Daily HCI Papers

每日自動抓取 HCI 領域最新論文，來源包含 arXiv、DBLP、Semantic Scholar、OpenAlex。

**線上版本：** https://mike-zheng.github.io/daily-hci

---

## 專案結構

```
daily-hci/
├── public/                  # 靜態網站根目錄（直接部署）
│   ├── index.html           # 前端頁面（Vue 3 CDN）
│   ├── .nojekyll            # 關閉 GitHub Pages Jekyll 處理
│   └── data/
│       ├── latest.json      # 最新一次抓取結果
│       └── papers-YYYY-MM-DD.json
├── scripts/                 # 後端抓取腳本（TypeScript）
│   ├── fetch-papers.ts      # 主程式
│   ├── adapters/            # 各來源抓取邏輯
│   │   ├── arxiv.ts
│   │   ├── dblp.ts
│   │   ├── semantic-scholar.ts
│   │   └── openalex.ts
│   └── utils/
│       ├── dedup.ts         # 去重合併
│       └── tagger.ts        # 自動標籤
├── src/
│   └── types/
│       └── paper.ts         # TypeScript 型別定義
├── .github/
│   └── workflows/
│       └── daily-update.yml # GitHub Actions 自動排程
├── package.json
└── tsconfig.json
```

---

## 前置需求

- **Node.js** >= 20
- **npm** >= 10

---

## 本地開發

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器前往 http://localhost:3000

### 手動抓取論文

```bash
npm run fetch
```

抓取結果會寫入 `public/data/latest.json` 與 `public/data/papers-YYYY-MM-DD.json`。

若有 API Key，可設置環境變數以提升請求上限：

```bash
$env:SEMANTIC_SCHOLAR_API_KEY = "your_key_here"   # PowerShell
$env:OPENALEX_API_KEY         = "your_key_here"

npm run fetch
```

---

## 部署

### GitHub Actions（自動）

`.github/workflows/daily-update.yml` 會在每週一至週五 **台灣時間早上 8:00**（UTC 00:00）自動執行：

1. 抓取最新論文 → 寫入 `public/data/`
2. Commit 並 push 資料更新
3. 將 `public/` 部署至 `gh-pages` 分支 → GitHub Pages

也可在 GitHub → Actions → **Daily HCI Paper Fetch & Deploy** → **Run workflow** 手動觸發。

### 設置 GitHub Secrets

前往 GitHub repo → **Settings → Secrets and variables → Actions**，新增：

| Secret 名稱 | 說明 |
|---|---|
| `SEMANTIC_SCHOLAR_API_KEY` | Semantic Scholar API Key（非必要，可提升速率） |
| `OPENALEX_API_KEY` | OpenAlex API Key（非必要） |

### 啟用 GitHub Pages

前往 GitHub repo → **Settings → Pages**：

- **Source**：Deploy from a branch
- **Branch**：`gh-pages` / `/ (root)`

部署完成後網站位於：https://mike-zheng.github.io/daily-hci

---

## 技術棧

| 層面 | 技術 |
|---|---|
| 前端 | Vue 3（CDN）、Tailwind CSS（CDN） |
| 抓取腳本 | TypeScript、tsx、Node.js fetch API |
| XML 解析 | fast-xml-parser |
| 部署 | GitHub Actions + GitHub Pages |
