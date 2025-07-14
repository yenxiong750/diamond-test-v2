export default async function handler(req, res) {
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
    const { giaNumber } = req.body || {};
    
    return res.status(200).json({
      message: "✅ NEW FUNCTION IS WORKING!",
      giaNumber: giaNumber || "test",
      timestamp: new Date().toISOString(),
      success: true,
      tests: {
        functionDeployment: { 
          success: true, 
          message: "Function deployed and responding correctly" 
        },
        basicConnectivity: { 
          success: true, 
          message: "Ready to test StoneAlgo connectivity" 
        }
      },
      data: {
        status: "Function working",
        readyForScraping: true
      },
      summary: {
        overallSuccess: true,
        recommendation: "✅ Function is working perfectly! Ready to add StoneAlgo scraping tests."
      },
      errors: []
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      message: "Function error",
      timestamp: new Date().toISOString()
    });
  }
}

