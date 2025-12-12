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
        return res.status(200).json({
            found: true,
            data: data[0]
        });

    } catch (error) {
        console.error('MOEA API Fetch Error:', error);
        return res.status(500).json({ error: 'Failed to fetch company data' });
    }
}
