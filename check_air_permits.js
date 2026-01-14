import ExcelJS from 'exceljs';

const workbook = new ExcelJS.Workbook();

try {
    await workbook.xlsx.readFile('./data/air_permits.xlsx');
    console.log('\n📊 目前 air_permits.xlsx 的分頁：\n');
    
    workbook.worksheets.forEach((ws, idx) => {
        const dataRows = ws.rowCount - 1; // 扣除表頭
        const marker = ws.name === '總表' ? '📊' : '📄';
        console.log(`${marker} ${idx + 1}. ${ws.name} - ${dataRows} 筆資料`);
    });
    
    console.log('\n');
} catch (err) {
    console.error('❌ 無法讀取檔案:', err.message);
}
