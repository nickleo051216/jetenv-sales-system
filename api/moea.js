export default async function handler(req, res) {
    const { taxId } = req.query;

    if (!taxId) {
        return res.status(400).json({ error: 'Tax ID is required' });
    }

    try {
        // API 1: 基本資料（目前使用中）
        const basicUrl = `http://data.gcis.nat.gov.tw/od/data/api/5F64D864-61CB-4D0D-8AD9-492047CC1EA6?$format=json&$filter=Business_Accounting_NO eq ${taxId}&$skip=0&$top=1`;

        // API 2: 登記項目資料（營業項目）
        const businessItemsUrl = `http://data.gcis.nat.gov.tw/od/data/api/426D5542-71FC-4547-9C54-30BDFE20C2CA?$format=json&$filter=Business_Accounting_NO eq ${taxId}`;

        // 同時查詢兩個 API
        const [basicRes, itemsRes] = await Promise.all([
            fetch(basicUrl),
            fetch(businessItemsUrl)
        ]);

        if (!basicRes.ok) {
            throw new Error(`MOEA API Error: ${basicRes.status}`);
        }

        const basicData = await basicRes.json();

        // 如果基本資料查無結果
        if (!basicData || basicData.length === 0) {
            return res.status(200).json({ found: false });
        }

        const company = basicData[0];

        // 查詢營業項目（可能失敗，不影響主流程）
        let businessItems = [];
        try {
            if (itemsRes.ok) {
                const itemsData = await itemsRes.json();
                businessItems = Array.isArray(itemsData) ? itemsData : [];
            }
        } catch (err) {
            console.warn('Failed to fetch business items:', err);
        }

        // 格式化營業項目
        const industryStats = businessItems.map(item => {
            const code = item.Business_Seq_NO || '';
            const name = item.Business_Item || item.Business_Item_Desc || '';
            return `${code} ${name}`.trim();
        }).filter(item => item.length > 0);

        const formattedData = {
            taxId: company.Business_Accounting_NO,
            name: company.Company_Name,
            status: company.Company_Status_Desc,
            representative: company.Responsible_Name,
            address: company.Company_Location,
            capital: company.Capital_Stock_Amount,
            organizationType: company.Company_Setup_Date ? 'Company' : 'Business',
            industryStats: industryStats
        };

        return res.status(200).json({
            found: true,
            data: formattedData
        });

    } catch (error) {
        console.error('MOEA API Fetch Error:', error);
        return res.status(500).json({ error: 'Failed to fetch company data' });
    }
}
