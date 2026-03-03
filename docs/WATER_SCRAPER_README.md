# 水污染防治許可證爬蟲 (Water Permit Scraper)

此腳本用於從 [環境部水污染源管制資料管理系統](https://waterpollutioncontrol.moenv.gov.tw/view/QueryList.aspx) 爬取工廠的水污染許可證資料，包含從 PDF 文件中解析的「效期」與「代填表公司」。

## 檔案位置
`scripts/water_permit_scraper_semi.js`

## 執行方式
```bash
node scripts/water_permit_scraper_semi.js
```
*依賴*: `puppeteer`, `exceljs`, `pdf-parse`, `axios`

## 操作流程 (半自動模式)
1.  **啟動**: 執行腳本後，會自動開啟 Chrome 瀏覽器。
2.  **手動查詢**: 
    *   請在瀏覽器中手動選擇 **「縣市」** 與 **「鄉鎮區」**。
    *   點擊 **「查詢」** 按鈕。
3.  **自動爬取**: 
    *   腳本偵測到查詢結果後，會自動開始運作。
    *   它會逐一進入每一筆工廠資料的詳情頁。
    *   自動點擊「許可證(文件) - 核准」頁籤。
    *   **下載最新的許可證 PDF** 並在背景解析文字。
    *   抓取 **「許可證有效期間」** 與 **「代填表公司名稱」**。
4.  **儲存**: 
    *   結果儲存於 `data/water_permits.xlsx`。
    *   格式包含「總表」與「地區分頁」。

## 輸出欄位
*   縣市 / 地區 (Source District)
*   管制編號 (Control No)
*   事業名稱 (Company Name)
*   行業別 (Industry)
*   **許可證效期 (Expiry Date)** (來自 PDF)
*   **代填表公司 (Representative)** (來自 PDF)

## 注意事項
*   **PDF 解析**: 由於資料來自 PDF 文件，解析速度會比純文字爬蟲稍慢，請耐心等待。
*   **格式變異**: 不同時期的許可證格式可能略有不同，若遇到無法解析的日期，Excel 會顯示「無法提取效期」。
