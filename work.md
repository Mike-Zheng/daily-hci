這是一個非常實用且能展現技術深度的 Side Project！碩班的研究與論文進度通常很緊湊，因此這個開發計畫的核心策略是「先求有（自動化資訊流），再求酷（視覺化與進階互動）」。

考量到要打造一個現代化、高效且易於維護的網頁，我們可以採用 Vue 3 與 Vite 作為基底，並搭配 GitHub Actions 來達成全自動更新，完全不需要租用後端伺服器。

以下是為你規劃的四階段開發藍圖：

### Phase 1: 基礎建設與架構設計 (Week 1)

這個階段的目標是搭建開發環境，並確認資料來源能順利抓取。

* **技術選型**：
* 核心框架：Vue 3 (Composition API) + Vite (建置極快，適合快速迭代)。
* UI / 樣式：Tailwind CSS（快速刻版）或直接使用你習慣的 UI Library。
* 資料解析：`fast-xml-parser` 或 `xml2js` (因為 arXiv 與 DBLP 提供的多為 XML/RSS 格式)。


* **資料流設計 (重點突破)**：
* **避開 CORS 陷阱**：前端直接 `fetch` arXiv API 通常會遇到跨域問題。建議設計一支簡單的 Node.js 腳本。
* **工作流程**：利用 Node.js 腳本呼叫 arXiv API (`search_query=cat:cs.HC`) 以及 DBLP RSS，將 XML 解析後轉成乾淨的 `daily-papers.json`。



### Phase 2: MVP 核心功能實作 (Week 2)

完成核心的「日報」閱讀體驗，讓網站具備基本的可用性。

* **自動化排程 (CI/CD)**：
* 設定 **GitHub Actions**。每天早上 8 點（或你習慣的時間）自動觸發 Workflow，執行 Phase 1 的 Node.js 腳本去抓最新論文，產出 `json` 檔後，自動 `npm run build` 並推送到 GitHub Pages。


* **前端介面開發**：
* **論文列表 (List View)**：實作卡片式佈局，顯示論文標題、作者、發表日期與摘要。
* **標籤系統 (Tagging)**：寫一個簡單的 Regex 函數，自動從摘要中抓取關鍵字（如 *LLM*, *VR/AR*, *CHI*, *Accessibility*）並生成標籤。
* **過濾與搜尋**：實作前端的搜尋框，讓你能快速篩選特定主題。



### Phase 3: 閱讀體驗優化 (Week 3)

這階段要讓它不僅是個工具，而是個「好用」的產品。

* **UI/UX 打磨**：
* 加入 **Dark Mode** 切換，這對長時間看程式碼與文獻的開發者來說是剛需。
* 實作「書籤/收藏」功能：利用瀏覽器的 `localStorage`，讓你可以把感興趣的論文先存起來，晚點再進 arXiv 下載 PDF。


* **效能優化**：
* 隨著 JSON 檔案變大，可以實作虛擬滾動 (Virtual Scrolling) 或分頁機制，確保 DOM 節點不會過載。將共用的邏輯（例如時間格式化、API 解析）抽離到 `utils` 資料夾，保持組件乾淨。



### Phase 4: 進階亮點與視覺化 (Week 4+)

當基礎日報穩定運作後，我們可以加入一些炫技或更深度的 HCI 探索功能。

* **3D 關聯視覺化 (結合 Three.js)**：
* 將每日論文的關鍵字或引用關係，利用 Three.js 繪製成 3D 的節點拓樸圖 (Node-Link Diagram)。讓使用者可以透過拖曳、旋轉來探索不同論文之間的概念聚合程度。


* **AI 摘要輔助**：
* 在 GitHub Actions 抓取資料時，可以稍微串接 OpenAI 的輕量 API (如 `gpt-4o-mini`)，把冗長的 Abstract 翻譯或濃縮成 3 句繁體中文的「核心貢獻重點」，大幅降低早晨掃讀的認知負擔。



