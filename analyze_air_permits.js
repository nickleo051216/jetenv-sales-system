import ExcelJS from 'exceljs';

const workbook = new ExcelJS.Workbook();

try {
    await workbook.xlsx.readFile('./data/air_permits.xlsx');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   📊 空氣污染許可證 Excel 檔案分析報告');
    console.log('═══════════════════════════════════════════════════════\n');

    let totalInSummary = 0;
    let allSheets = [];

    workbook.worksheets.forEach((ws, idx) => {
        const dataRows = ws.rowCount - 1; // 扣除表頭
        const info = {
            index: idx + 1,
            name: ws.name,
            rows: dataRows,
            isSummary: ws.name === '總表'
        };

        allSheets.push(info);

        if (ws.name === '總表') {
            totalInSummary = dataRows;
        }
    });

    // 按類型分組顯示
    console.log('📊 總表：');
    const summarySheets = allSheets.filter(s => s.isSummary);
    summarySheets.forEach(s => {
        console.log(`   ✅ ${s.name} - ${s.rows} 筆資料`);
    });

    console.log('\n📄 地區分頁：');
    const districtSheets = allSheets.filter(s => !s.isSummary).sort((a, b) => b.rows - a.rows);
    districtSheets.forEach(s => {
        console.log(`   ${s.index}. ${s.name.padEnd(12)} - ${s.rows.toString().padStart(3)} 筆`);
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`   📈 總計：${districtSheets.length} 個地區，${totalInSummary} 筆許可證資料`);
    console.log('═══════════════════════════════════════════════════════\n');

} catch (err) {
    console.error('❌ 無法讀取檔案:', err.message);
}
