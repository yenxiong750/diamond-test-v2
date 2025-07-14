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
    
    const testResults = {
      giaNumber: giaNumber,
      timestamp: new Date().toISOString(),
      tests: {},
      success: false,
      data: null,
      errors: []
    };

    // Test 1: Try to access StoneAlgo
    try {
      const response = await fetch('https://www.stonealgo.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      testResults.tests.basicConnectivity = {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Successfully connected to StoneAlgo' : 'Failed to connect'
      };
      
    } catch (error) {
      testResults.tests.basicConnectivity = {
        success: false,
        error: error.message
      };
      testResults.errors.push('Cannot access StoneAlgo: ' + error.message);
    }

    // Test 2: Try GIA number lookup
    if (giaNumber) {
      try {
        const giaUrl = `https://www.stonealgo.com/diamond-details/GIA-number-${giaNumber}`;
        const response = await fetch(giaUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const text = await response.text();
        const hasDiamondData = text.includes('carat') && text.includes('color');
        
        testResults.tests.giaLookup = {
          success: response.ok && hasDiamondData,
          status: response.status,
          url: giaUrl,
          hasDiamondData: hasDiamondData,
          message: hasDiamondData ? 'Found diamond data!' : 'No diamond data found'
        };
        
        if (hasDiamondData) {
          testResults.success = true;
          testResults.data = {
            found: 'Diamond data detected in response',
            recommendation: 'Scraping appears possible!'
          };
        }
        
      } catch (error) {
        testResults.tests.giaLookup = {
          success: false,
          error: error.message
        };
        testResults.errors.push('GIA lookup failed: ' + error.message);
      }
    }

    // Final assessment
    testResults.summary = {
      overallSuccess: testResults.success,
      recommendation: testResults.success ? 
        'StoneAlgo scraping appears feasible! You can proceed with building your diamond cut score calculator.' : 
        'StoneAlgo scraping is blocked. Consider using GIA API, PDF OCR, or manual data entry instead.'
    };

    return res.status(200).json(testResults);

  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      message: "Function error - check syntax"
    });
  }
}
