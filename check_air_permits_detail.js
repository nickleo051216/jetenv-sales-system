import ExcelJS from 'exceljs';

const workbook = new ExcelJS.Workbook();

try {
    await workbook.xlsx.readFile('./data/air_permits.xlsx');
    console.log('\n📊 目前 air_permits.xlsx 的分頁：\n');

    let totalInSummary = 0;

    workbook.worksheets.forEach((ws, idx) => {
        const dataRows = ws.rowCount - 1; // 扣除表頭
        const marker = ws.name === '總表' ? '📊' : '📄';
        console.log(`${marker} ${idx + 1}. ${ws.name.padEnd(15)} - ${dataRows} 筆資料`);

        if (ws.name === '總表') {
            totalInSummary = dataRows;
        }
    });

    console.log(`\n✅ 總表總計：${totalInSummary} 筆資料\n`);
} catch (err) {
    console.error('❌ 無法讀取檔案:', err.message);
}
