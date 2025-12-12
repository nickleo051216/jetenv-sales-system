const url = "http://data.gcis.nat.gov.tw/od/data/api/5F64D864-61CB-4D0D-8AD9-492047CC1EA6?$format=json&$filter=Business_Accounting_NO eq 20828393&$skip=0&$top=1";

console.log("Fetching from:", url);

fetch(url)
    .then(res => {
        console.log("Status:", res.status);
        return res.json();
    })
    .then(data => {
        console.log("Data received:");
        console.log(JSON.stringify(data, null, 2));
        const fs = require('fs');
        try {
            fs.writeFileSync('moea_response.json', JSON.stringify(data, null, 2));
            console.log("File written successfully.");
        } catch (e) {
            console.error("Write failed:", e);
        }
    })
    .catch(err => console.error("Fetch Error:", err));
