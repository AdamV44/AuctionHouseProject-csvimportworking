const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Papa = require('papaparse');

async function main() {
  const csvPath = path.join(__dirname, '..', 'download', 'test-items-15.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found:', csvPath);
    process.exit(1);
  }
  const csv = fs.readFileSync(csvPath, 'utf8');
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  const items = parsed.data.map(row => {
    const { Name, StartingPrice, ...rest } = row;
    // convert rest into additionalParameters JSON string
    const additional = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v && String(v).trim() !== '') {
        additional[k] = String(v);
      }
    }
    return {
      id: '0',
      name: Name,
      startingPrice: Number(StartingPrice),
      auctionId: '',
      picturesPaths: [],
      additionalParameters: Object.keys(additional).length ? JSON.stringify(additional) : ''
    };
  });

  console.log('Posting', items.length, 'items to API...');
  try {
  const res = await axios.post('http://localhost:5200/api/AuctionItems/create-multiple', items);
    console.log('API response status:', res.status);
    console.log('Response data:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('API error status:', err.response.status);
      console.error('API error data:', err.response.data);
    } else {
      console.error('Request failed:', err.message);
    }
    process.exit(1);
  }
}

main();
