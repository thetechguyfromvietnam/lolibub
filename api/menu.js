const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read menu.json from root directory
    const menuPath = path.join(process.cwd(), 'menu.json');
    const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
    
    res.status(200).json(menuData);
  } catch (error) {
    console.error('Error loading menu:', error);
    res.status(500).json({ error: 'Không thể tải menu' });
  }
};

