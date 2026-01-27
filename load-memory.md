# Project Memory & Critical Logic

此文件用於記錄專案中的關鍵邏輯與使用者需求，防止未來修改時遺失。

## 🏭 空污操作許可證爬蟲 (Air Permit Scraper)

**檔案**: `scripts/air_permit_scraper_semi.js`

### 核心輸出邏輯 (不可修改)
使用者嚴格規定：**所有爬取結果必須整合在同一個 Excel 檔案中 (`data/air_permits.xlsx`)。**

### Excel 分頁結構 (Sheet Structure)
1.  **📊 總表 (Summary)**
    *   **位置**: 必須是 **第 1 個分頁**。
    *   **規則**: 每次爬取的新資料，必須 **追加 (Append)** 到此表。
    *   **內容**: 包含所有地區的資料，並增加 `district` 欄位標示來源。
    
2.  **📄 地區分頁 (District Sheets)**
    *   **位置**: 接在總表之後。
    *   **規則**: 每個地區 (如 `土城區`, `樹林區`) 擁有獨立分頁。
    *   **內容**: 僅包含該次爬取該地區的資料。

### 維護指南
*   若修改爬蟲，**務必保留上述「總表累積 + 地區獨立」的輸出邏輯**。
*   使用 `exceljs` 套件處理 Excel 讀寫。
