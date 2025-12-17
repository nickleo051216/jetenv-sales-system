const XLSX = require('xlsx');
const wb = XLSX.readFile('data/air_permits.xlsx');
console.log('工作表:', wb.SheetNames);
wb.SheetNames.forEach(s => {
  const data = XLSX.utils.sheet_to_json(wb.Sheets[s]);
  console.log('\n=== ' + s + ' (' + data.length + ' 筆) ===');
  if(data.length > 0) {
    data.slice(0, 10).forEach(r => console.log(JSON.stringify(r)));
  }
});
