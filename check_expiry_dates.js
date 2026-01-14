import ExcelJS from 'exceljs';

const workbook = new ExcelJS.Workbook();

try {
    await workbook.xlsx.readFile('./data/air_permits.xlsx');

    console.log('\n📊 分析不同製程的到期日差異\n');

    // 找一個有合併資料的分頁（泰山區_下午0100是新的測試結果）
    const testSheet = workbook.getWorksheet('泰山區_下午0100');

    if (testSheet) {
        console.log(`分析分頁：${testSheet.name}\n`);

        for (let i = 2; i <= Math.min(testSheet.rowCount, 6); i++) {
            const row = testSheet.getRow(i);
            const emsNo = row.getCell(2).value;
            const companyName = row.getCell(3).value;
            const processCount = row.getCell(5).value;
            const processes = row.getCell(6).value;
            const earliestExpiry = row.getCell(9).value;
            const latestExpiry = row.getCell(10).value;

            if (emsNo) {
                console.log(`\n🏭 ${companyName}`);
                console.log(`   EMS No: ${emsNo}`);
                console.log(`   製程數量: ${processCount}`);

                if (processes) {
                    console.log(`   製程清單:`);
                    const processList = processes.toString().split('\n');
                    processList.forEach((p, idx) => {
                        console.log(`      ${idx + 1}. ${p}`);
                    });
                }

                console.log(`   最早到期: ${earliestExpiry || '無'}`);
                console.log(`   最晚到期: ${latestExpiry || '無'}`);

                if (earliestExpiry !== latestExpiry && earliestExpiry && latestExpiry) {
                    console.log(`   ⚠️  不同製程有不同到期日！`);
                }
            }
        }
    } else {
        console.log('找不到測試分頁，顯示可用分頁：');
        workbook.worksheets.forEach((ws, idx) => {
            console.log(`   ${idx + 1}. ${ws.name}`);
        });
    }

} catch (err) {
    console.error('❌ 錯誤:', err.message);
}
