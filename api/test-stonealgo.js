// api/test-stonealgo.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { giaNumber } = req.body;
    
    // Simple test response first
    return res.status(200).json({
      message: "✅ Vercel function is working!",
      giaNumber: giaNumber,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      message: "Function error"
    });
  }
}