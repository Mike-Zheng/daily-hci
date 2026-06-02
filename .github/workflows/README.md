# GitHub Actions 工作流程說明

## 檔案：`daily-update.yml`

每天自動抓取 HCI 論文並部署到 GitHub Pages。

---

## 觸發條件

| 方式 | 設定 | 說明 |
|------|------|------|
| 排程 | `cron: '5 0 * * *'` | 每天 UTC 00:05（台灣早上 08:05）自動執行 |
| 手動 | `workflow_dispatch` | 在 GitHub Actions 頁面點「Run workflow」手動觸發 |

> **為什麼是 00:05 而不是 00:00？**
> GitHub Actions 的排程在整點（尤其是 00:00 UTC）有大量 repository 同時排隊，
> 容易因為佇列壅塞而被跳過或延遲數小時。改為 00:05 可有效降低此問題。

---

## Job 架構

```
fetch-and-commit  ──→  deploy
```

兩個 job 依序執行，`deploy` 必須等 `fetch-and-commit` 成功才會啟動。

---

## fetch-and-commit

| 步驟 | Action / 指令 | 說明 |
|------|--------------|------|
| Checkout | `actions/checkout@v6` | 取出 repo 程式碼 |
| Setup Node.js | `actions/setup-node@v6` | 安裝 Node.js 24 |
| Install | `npm ci` | 安裝相依套件 |
| Fetch papers | `npm run fetch` | 執行 `scripts/fetch-papers.ts`，抓取論文並寫入 `public/data/` |
| Commit | git + push | 若資料有變更就 commit（訊息：`chore: update papers YYYY-MM-DD`）並 push |
| Upload artifact | `actions/upload-pages-artifact@v5` | 打包 `public/` 供 Pages 部署使用 |
| Discord 通知 | curl | 若設定了 `DISCORD_WEBHOOK_URL` secret，結束後發送通知 |

---

## deploy

| 步驟 | Action | 說明 |
|------|--------|------|
| Deploy to Pages | `actions/deploy-pages@v5` | 將 artifact 部署到 GitHub Pages |

---

## Secrets 設定

前往 `Settings → Secrets and variables → Actions` 設定以下 secrets：

| Secret 名稱 | 必填 | 說明 |
|------------|------|------|
| `SEMANTIC_SCHOLAR_API_KEY` | 否 | Semantic Scholar API key（無 key 時 rate limit 較嚴格） |
| `OPENALEX_API_KEY` | 否 | OpenAlex API key（目前作為 mailto 使用） |
| `DISCORD_WEBHOOK_URL` | 否 | Discord webhook，用於執行結果通知 |

---

## Permissions 設定

```yaml
permissions:
  contents: write   # 允許 push commit（更新論文資料）
  pages: write      # 允許部署 GitHub Pages
  id-token: write   # OIDC token，Pages 部署所需
```

---

## Action 版本說明

| Action | 使用版本 | Node.js runtime | 說明 |
|--------|---------|----------------|------|
| `actions/checkout` | `@v6` | Node.js 24 | v4 及以下使用 Node.js 20（已廢棄） |
| `actions/setup-node` | `@v6` | Node.js 24 | v4 及以下使用 Node.js 20（已廢棄） |
| `actions/upload-pages-artifact` | `@v5` | Node.js 24 | v3 使用 Node.js 20（已廢棄） |
| `actions/deploy-pages` | `@v5` | Node.js 24 | v4 使用 Node.js 20（已廢棄） |

> **Node.js 20 廢棄時程**
> - 2025-09-19：GitHub 宣布廢棄 Node.js 20 runner
> - 2026-06-16：強制改用 Node.js 24（使用舊版 action 會出現警告）
> - 2026-09-16：Node.js 20 從 runner 移除（舊版 action 將無法執行）
>
> 解決方式：升級至原生支援 Node.js 24 的 action 版本（如上表）。
> 使用 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` 只是讓舊版 action 強制跑在 Node.js 24，
> 仍會顯示警告，且不保證相容性；正確做法是升級版本。

---

## 常見問題

**Q：排程到了卻沒執行？**
GitHub Actions 排程並非精確計時，尤其整點時段常有延遲。若超過 2 小時仍未執行，
可在 Actions 頁面手動點「Run workflow」。

**Q：如何確認昨天的資料有更新？**
查看 `git log` 或 GitHub commit 記錄，應有 `chore: update papers YYYY-MM-DD` 的 commit。
若沒有，表示 fetch 成功但論文數為 0（或資料未變更）。

**Q：如何更新 action 版本？**
前往各 action 的 GitHub 頁面確認最新版本：
- [actions/checkout](https://github.com/actions/checkout/releases)
- [actions/setup-node](https://github.com/actions/setup-node/releases)
- [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact/releases)
- [actions/deploy-pages](https://github.com/actions/deploy-pages/releases)
