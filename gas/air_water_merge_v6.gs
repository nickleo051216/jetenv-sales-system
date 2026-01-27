/**
 * ============================================================
 * 🚀 空水許可合併工具 V6 (含 Supabase 同步)
 * 
 * 新增功能：
 * - 同步到 Supabase air_permits 表
 * ============================================================
 */

// ⚠️ 請將此 URL 替換為您的 n8n Webhook URL
const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/sync-air-permits';

/** 設定工作表分頁顏色 */
function setSheetTabDarkGreen(sheet) {
  sheet.setTabColor("#1B5E20");
}

/** 建立選單 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🚀 空水合併工具")
    .addItem("▶ 合併當前工作表", "mergeAirWater")
    .addItem("▶ 查詢統編 (依B欄名稱)", "batchQueryUniformNo")
    .addSeparator()
    .addItem("🔄 同步到 Supabase", "syncToSupabase")
    .addToUi();
}

/** ========= 日期轉換：民國斜線 -> ISO (YYYY-MM-DD) =========
 * V5 update: 支援 Date 物件 + 放寬正則
 */
function minguoSlashToISO(s) {
  if (!s) return "";
  // 如果 Google 已經轉成 Date 物件
  if (Object.prototype.toString.call(s) === "[object Date]") {
    return Utilities.formatDate(s, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  // 文字模式處理
  const t = String(s).trim();
  const m = t.match(/(\d{3,4})\/(\d{1,2})\/(\d{1,2})/);
  if (!m) return "";
  const y = Number(m[1]) + 1911;
  const mm = String(m[2]).padStart(2, "0");
  const dd = String(m[3]).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/** ========= 日期轉換：民國中文年月日 -> ISO (YYYY-MM-DD) ========= */
function minguoChineseToISO(s) {
  if (!s) return "";
  if (Object.prototype.toString.call(s) === "[object Date]") {
    return Utilities.formatDate(s, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  const t = String(s).trim();
  const m = t.match(/(\d{3,4})年(\d{1,2})月(\d{1,2})日/);
  if (!m) return "";
  const y = Number(m[1]) + 1911;
  const mm = String(m[2]).padStart(2, "0");
  const dd = String(m[3]).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/** ========= 狀態正規化 ========= */
function normalizeWaterStatus(raw) {
  const s = String(raw || "").trim();
  if (s.match(/停工|停業|歇業/)) return "永久停工";
  if (s.match(/營運|運轉|正常/)) return "營運中";
  if (!s) return "";
  return s;
}

/** 從地址提取縣市 */
function extractCounty(address) {
  if (!address) return "";
  const match = String(address).match(/^([\u4e00-\u9fa5]{2,3}[市縣])/);
  return match ? match[1] : "";
}

/**
 * ============================================================
 * Phase 1：空水合併主程式
 * ============================================================
 */
function mergeAirWater() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const srcSheet = ss.getActiveSheet();
  const srcName = srcSheet.getName();

  if (srcName.includes("-空水合併")) {
    SpreadsheetApp.getUi().alert("⚠️ 這一頁已經是合併結果囉！\n請回到原始資料的分頁再執行。");
    return;
  }

  const data = srcSheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert("⚠️ 這一頁沒什麼資料，請確認有貼上內容！");
    return;
  }

  // === 輸出欄位 (13欄) ===
  const headers = [
    "emsno", "facilityname", "uniformno", "目前運作狀態(水)", "預計排程", 
    "結果", "初步行動", "顧問公司(代填表公司)", "電話", 
    "許可證效期(水)", "許可證效期(空氣)", "facilityaddress", ""
  ];

  let currentMode = null;
  let waterHeaderIndex = {};
  let airHeaderIndex = {};
  
  const dataMap = new Map();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowStr = row.join("");

    if (row.includes("管制編號") && row.includes("事業名稱") && (row.includes("代填表公司") || row.includes("許可證效期"))) {
      currentMode = "WATER";
      waterHeaderIndex = {
        emsno: row.indexOf("管制編號"),
        name: row.indexOf("事業名稱"),
        status: row.indexOf("目前運作狀態"),
        expiry: row.indexOf("許可證效期"),
        consultant: row.indexOf("代填表公司"),
      };
      continue;
    }

    if (row.includes("ems_no") && row.includes("company_name")) {
      currentMode = "AIR";
      airHeaderIndex = {
        emsno: row.indexOf("ems_no"),
        name: row.indexOf("company_name"),
        address: row.indexOf("address"),
        earliest: row.indexOf("earliest_expiry_date"),
      };
      continue;
    }

    if (rowStr.trim() === "") continue;

    if (currentMode === "WATER") {
      const emsno = row[waterHeaderIndex.emsno];
      if (!emsno || String(emsno).trim() === "" || String(emsno).includes("管制編號")) continue;

      const id = String(emsno).trim();
      const waterStatus = normalizeWaterStatus(row[waterHeaderIndex.status]);
      const waterExpiryISO = minguoChineseToISO(row[waterHeaderIndex.expiry]) || ""; 
      const consultant = row[waterHeaderIndex.consultant] || "";
      const name = row[waterHeaderIndex.name] || "";

      if (dataMap.has(id)) {
        const existing = dataMap.get(id);
        existing.facilityname = existing.facilityname || name;
        existing.consultant = consultant || existing.consultant || "";
        existing.waterExpiry = waterExpiryISO || existing.waterExpiry || "";
        existing.waterStatus = waterStatus || existing.waterStatus || "";
        existing.hasWater = true;
      } else {
        dataMap.set(id, {
          emsno: id, facilityname: name, consultant: consultant,
          waterExpiry: waterExpiryISO, waterStatus: waterStatus,
          airExpiry: "", facilityaddress: "", hasWater: true, hasAir: false,
        });
      }
      continue;
    }

    if (currentMode === "AIR") {
      const emsno = row[airHeaderIndex.emsno];
      if (!emsno || String(emsno).trim() === "" || String(emsno).includes("ems_no")) continue;

      const id = String(emsno).trim();
      const name = row[airHeaderIndex.name] || "";
      const addr = row[airHeaderIndex.address] || "";
      const airExpiryISO = minguoSlashToISO(row[airHeaderIndex.earliest]) || "";

      if (dataMap.has(id)) {
        const existing = dataMap.get(id);
        existing.facilityname = existing.facilityname || name;
        existing.airExpiry = airExpiryISO || existing.airExpiry || "";
        existing.facilityaddress = existing.facilityaddress || addr;
        existing.hasAir = true;
      } else {
        dataMap.set(id, {
          emsno: id, facilityname: name, consultant: "",
          waterExpiry: "", waterStatus: "",
          airExpiry: airExpiryISO, facilityaddress: addr,
          hasWater: false, hasAir: true,
        });
      }
      continue;
    }
  }

  const outputData = [];
  dataMap.forEach((item) => {
    if (item.hasWater && item.waterStatus === "永久停工") return;

    outputData.push([
      item.emsno, item.facilityname || "", "", item.waterStatus || "",
      "", "", "", item.consultant || "", "",
      item.waterExpiry || "", item.airExpiry || "",
      item.facilityaddress || "", ""
    ]);
  });

  outputData.sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  const targetSheetName = srcName + "-空水合併";
  let targetSheet = ss.getSheetByName(targetSheetName);
  if (targetSheet) targetSheet.clear();
  else targetSheet = ss.insertSheet(targetSheetName);

  targetSheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground("#4A90D9").setFontColor("#FFFFFF").setFontWeight("bold");

  if (outputData.length > 0) {
    const dataRange = targetSheet.getRange(2, 1, outputData.length, headers.length);
    dataRange.setNumberFormat("@");
    dataRange.setValues(outputData);

    const sortedBackgrounds = outputData.map((row) => {
      const id = row[0];
      const item = dataMap.get(id);
      if (item.hasWater && item.hasAir) return new Array(headers.length).fill("#FCE5CD");
      if (item.hasWater) return new Array(headers.length).fill("#CFE2F3");
      return new Array(headers.length).fill("#D9EAD3");
    });
    dataRange.setBackgrounds(sortedBackgrounds);
  }

  const lastRow = outputData.length + 1;
  const rules = targetSheet.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($J2<>"",$J2<=EDATE(TODAY(),6))')
    .setFontColor("#FF0000").setBold(true)
    .setRanges([targetSheet.getRange(`J2:J${lastRow}`)]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($K2<>"",$K2<=EDATE(TODAY(),6))')
    .setFontColor("#FF0000").setBold(true)
    .setRanges([targetSheet.getRange(`K2:K${lastRow}`)]).build());
  
  targetSheet.setConditionalFormatRules(rules);
  targetSheet.autoResizeColumns(1, headers.length);
  targetSheet.setFrozenRows(1);
  targetSheet.activate();

  SpreadsheetApp.getUi().alert(`✅ 合併完畢！\n資料筆數：${outputData.length}`);
}

/**
 * ============================================================
 * Phase 2：批次查詢統編 (g0v API)
 * ============================================================
 */
function batchQueryUniformNo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const ui = SpreadsheetApp.getUi();

  const header = sheet.getRange(1, 2).getValue();
  if (header !== "facilityname" && header !== "事業名稱") {
    if (ui.alert("確認", "B欄似乎不是事業名稱，要繼續嗎？", ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const companyNames = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  const currentTaxIds = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
  const resultTaxIds = [];
  let updateCount = 0;

  ss.toast("🚀 開始查詢統編...", "處理中", -1);

  for (let i = 0; i < companyNames.length; i++) {
    const rawName = String(companyNames[i][0] || "").trim();
    const currentId = String(currentTaxIds[i][0] || "").trim();

    if (currentId.length === 8) {
      resultTaxIds.push([currentId]);
      continue;
    }

    let foundId = "";
    if (rawName) {
      foundId = fetchTaxIdFromG0v(rawName);
      if (!foundId) {
        const cleaned = cleanName(rawName);
        if (cleaned !== rawName) foundId = fetchTaxIdFromG0v(cleaned);
      }
    }

    if (foundId) {
      resultTaxIds.push([foundId]);
      updateCount++;
    } else {
      resultTaxIds.push([currentId]);
    }

    if ((i + 1) % 10 === 0) {
      Utilities.sleep(600);
      ss.toast(`進度：${i + 1} / ${companyNames.length}`, "查詢中");
    }
  }

  sheet.getRange(2, 3, resultTaxIds.length, 1).setValues(resultTaxIds);
  setSheetTabDarkGreen(sheet);
  ss.toast("✅ 查詢完成！", "完成");
}

function fetchTaxIdFromG0v(queryName) {
  try {
    const url = `https://company.g0v.ronny.tw/api/search?q=${encodeURIComponent(queryName)}`;
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) {
      const json = JSON.parse(res.getContentText());
      if (json.data && json.data.length > 0) return json.data[0]["統一編號"] || "";
    }
  } catch (e) { console.error(e); }
  return "";
}

function cleanName(name) {
  let s = String(name || "");
  s = s.replace(/[\(（].*?[\)）]/g, "").replace(/台灣分公司|三重(分?廠)?|五股(分?廠)?|桃園(分?廠)?|台北(分?廠)?/g, "");
  s = s.replace(/[一二三四五六七八九十]廠/g, "").replace(/工廠$|總廠$|分公司$/g, "");
  return s.trim();
}

/**
 * ============================================================
 * Phase 3：同步到 Supabase (透過 n8n Webhook)
 * ============================================================
 */
function syncToSupabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const sheetName = sheet.getName();
  const ui = SpreadsheetApp.getUi();
  
  // 確認是合併後的工作表
  if (!sheetName.includes("-空水合併")) {
    ui.alert("⚠️ 請先執行「合併當前工作表」，\n然後在合併結果頁面執行同步！");
    return;
  }
  
  // 確認 Webhook URL 已設定
  if (N8N_WEBHOOK_URL.includes('your-n8n-instance')) {
    ui.alert("⚠️ 請先設定 N8N_WEBHOOK_URL！\n\n請在程式碼最上方修改 N8N_WEBHOOK_URL 變數。");
    return;
  }
  
  // 確認同步
  const confirm = ui.alert(
    "確認同步", 
    `即將同步「${sheetName}」到 Supabase air_permits 表。\n\n確定要繼續嗎？`,
    ui.ButtonSet.YES_NO
  );
  
  if (confirm !== ui.Button.YES) return;
  
  ss.toast("🔄 正在同步...", "處理中", -1);
  
  try {
    // 讀取資料
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // 找欄位索引
    const emsnoIdx = headers.indexOf("emsno");
    const nameIdx = headers.indexOf("facilityname");
    const addressIdx = headers.indexOf("facilityaddress");
    const airExpiryIdx = headers.indexOf("許可證效期(空氣)");
    
    if (emsnoIdx === -1 || airExpiryIdx === -1) {
      ui.alert("❌ 找不到必要欄位！\n\n請確認工作表包含 emsno 和 許可證效期(空氣) 欄位。");
      return;
    }
    
    // 轉換資料
    const records = rows
      .filter(row => row[emsnoIdx] && row[airExpiryIdx])  // 只同步有空氣期效的
      .map(row => ({
        ems_no: String(row[emsnoIdx]).trim(),
        company_name: row[nameIdx] || "",
        address: row[addressIdx] || "",
        expiry_date: row[airExpiryIdx] || "",  // 已經是 ISO 格式
        category: "操作",
        county: extractCounty(row[addressIdx])
      }));
    
    if (records.length === 0) {
      ui.alert("⚠️ 沒有找到有空氣許可證期效的資料！");
      return;
    }
    
    // 呼叫 n8n Webhook
    const response = UrlFetchApp.fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify({
        sheetName: sheetName,
        records: records,
        timestamp: new Date().toISOString()
      }),
      muteHttpExceptions: true
    });
    
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (statusCode === 200) {
      let resultMessage = "";
      try {
        const result = JSON.parse(responseText);
        resultMessage = result.message || `已同步 ${records.length} 筆`;
      } catch (e) {
        resultMessage = `已同步 ${records.length} 筆`;
      }
      
      setSheetTabDarkGreen(sheet);
      ui.alert(`✅ 同步完成！\n\n${resultMessage}`);
    } else {
      ui.alert(`❌ 同步失敗！\n\nHTTP ${statusCode}\n${responseText}`);
    }
    
  } catch (e) {
    ui.alert("❌ 同步發生錯誤：\n" + e.message);
    console.error(e);
  }
  
  ss.toast("完成", "同步", 3);
}
