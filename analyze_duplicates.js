import ExcelJS from 'exceljs';

const workbook = new ExcelJS.Workbook();

try {
    await workbook.xlsx.readFile('./data/air_permits.xlsx');

    console.log('\n📊 分析空氣污染許可證資料的重複情況\n');

    // 選擇一個地區分頁來分析
    const sampleSheet = workbook.worksheets.find(ws => ws.name === '新莊區') || workbook.worksheets[0];

    console.log(`分析分頁：${sampleSheet.name}\n`);

    // 統計每個工廠的程序數量
    const factoryProcessCount = new Map();
    const factoryData = new Map();

    for (let i = 2; i <= Math.min(sampleSheet.rowCount, 20); i++) {
        const row = sampleSheet.getRow(i);
        const emsNo = row.getCell(2).value;
        const companyName = row.getCell(3).value;
        const processId = row.getCell(5).value;
        const processName = row.getCell(6).value;
        const category = row.getCell(7).value;
        const permitNo = row.getCell(8).value;
        const expiryDate = row.getCell(10).value;

        if (emsNo) {
            if (!factoryProcessCount.has(emsNo)) {
                factoryProcessCount.set(emsNo, 0);
                factoryData.set(emsNo, {
                    emsNo,
                    companyName,
                    processes: []
                });
            }
            factoryProcessCount.set(emsNo, factoryProcessCount.get(emsNo) + 1);
            factoryData.get(emsNo).processes.push({
                processId,
                processName,
                category,
                permitNo,
                expiryDate
            });
        }
    }

    // 顯示有多個程序的工廠
    console.log('🏭 有多個程序的工廠範例：\n');
    let count = 0;
    for (const [emsNo, data] of factoryData.entries()) {
        if (data.processes.length > 1 && count < 3) {
            console.log(`EMS No: ${emsNo}`);
            console.log(`公司名稱: ${data.companyName}`);
            console.log(`程序數量: ${data.processes.length}`);
            data.processes.forEach((proc, idx) => {
                console.log(`  ${idx + 1}. ${proc.processId} - ${proc.processName} (${proc.category})`);
                console.log(`     許可證號: ${proc.permitNo}`);
                console.log(`     效期: ${proc.expiryDate}`);
            });
            console.log('');
            count++;
        }
    }

    // 統計
    const totalFactories = factoryProcessCount.size;
    const factoriesWithMultipleProcesses = Array.from(factoryProcessCount.values()).filter(c => c > 1).length;
    const totalProcesses = Array.from(factoryProcessCount.values()).reduce((sum, c) => sum + c, 0);

    console.log('═══════════════════════════════════════');
    console.log(`總工廠數: ${totalFactories}`);
    console.log(`總程序筆數: ${totalProcesses}`);
    console.log(`有多個程序的工廠: ${factoriesWithMultipleProcesses}`);
    console.log(`平均每個工廠程序數: ${(totalProcesses / totalFactories).toFixed(2)}`);
    console.log('═══════════════════════════════════════\n');

} catch (err) {
    console.error('❌ 錯誤:', err.message);
}
