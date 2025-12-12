const taxId = "20828393";
const url = `http://data.gcis.nat.gov.tw/od/data/api/5F64D864-61CB-4D0D-8AD9-492047CC1EA6?$format=json&$filter=Business_Accounting_NO eq ${taxId}&$skip=0&$top=1`;
const encodedUrl = encodeURI(url);

fetch(encodedUrl)
    .then(res => res.json())
    .then(data => {
        const fs = require('fs');
        fs.writeFileSync('moea_full_response.json', JSON.stringify(data, null, 2));
    });
