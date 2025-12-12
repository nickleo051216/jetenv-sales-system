export default async function handler(req, res) {
    const { taxId } = req.query;

    if (!taxId) {
        return res.status(400).json({ error: 'Tax ID is required' });
    }

    try {
        const apiUrl = `http://data.gcis.nat.gov.tw/od/data/api/5F64D864-61CB-4D0D-8AD9-492047CC1EA6?$format=json&$filter=Business_Accounting_NO eq ${taxId}&$skip=0&$top=1`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`MOEA API Error: ${response.status}`);
        }

        const data = await response.json();

        // Return null if no data found (empty array)
        if (!data || data.length === 0) {
            return res.status(200).json({ found: false });
        }

        // Return the first match
        const company = data[0];

        // Format the data for easier consumption
        // Note: MOEA API may use different field names for business items
        const businessItems = company.Cmp_Business || company.Business_Item || [];

        const formattedData = {
            taxId: company.Business_Accounting_NO,
            name: company.Company_Name,
            status: company.Company_Status_Desc,
            representative: company.Responsible_Name,
            address: company.Company_Location,
            capital: company.Capital_Stock_Amount,
            organizationType: company.Company_Setup_Date ? 'Company' : 'Business',
            industryStats: Array.isArray(businessItems)
                ? businessItems.map(item => `${item.Business_Seq_NO || ''} ${item.Business_Item || item.Business_Item_Desc || ''}`.trim())
                : []
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
