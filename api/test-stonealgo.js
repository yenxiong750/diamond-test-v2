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
    const { giaNumber } = req.body;
    
    const testResults = {
      giaNumber,
      timestamp: new Date().toISOString(),
      tests: {},
      success: false,
      data: null,
      errors: []
    };

    // Test 1: Basic connectivity to StoneAlgo
    try {
      const response = await fetch('https://www.stonealgo.com/', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const text = await response.text();
      
      testResults.tests.basicConnectivity = {
        success: response.ok,
        status: response.status,
        hasStoneAlgo: text.toLowerCase().includes('stonealgo'),
        hasDiamond: text.toLowerCase().includes('diamond'),
        hasGIA: text.toLowerCase().includes('gia')
      };
      
    } catch (error) {
      testResults.tests.basicConnectivity = {
        success: false,
        error: error.message
      };
      testResults.errors.push(`Basic connectivity failed: ${error.message}`);
    }

    // Test 2: Try direct GIA URL patterns
    if (giaNumber) {
      const testUrls = [
        `https://www.stonealgo.com/diamond-details/GIA-number-${giaNumber}`,
        `https://www.stonealgo.com/diamond-details/${giaNumber}`,
        `https://www.stonealgo.com/check/${giaNumber}`
      ];

      for (let i = 0; i < testUrls.length; i++) {
        const url = testUrls[i];
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          const text = await response.text();
          
          const hasDiamondData = text.toLowerCase().includes('carat') && 
                                text.toLowerCase().includes('color') && 
                                text.toLowerCase().includes('clarity');
          
          const hasError = text.toLowerCase().includes('not found') || 
                          text.toLowerCase().includes('error') ||
                          response.status === 404;
          
          testResults.tests[`directUrl_${i+1}`] = {
            success: response.ok && hasDiamondData && !hasError,
            url: url,
            status: response.status,
            hasDiamondData,
            hasError,
            title: text.match(/<title>(.*?)<\/title>/i)?.[1] || 'No title'
          };
          
          if (hasDiamondData && !hasError) {
            testResults.success = true;
            
            // Try to extract basic diamond data
            const extractedData = {
              foundCarat: text.match(/(\d+\.?\d*)\s*carat/i)?.[1],
              foundColor: text.match(/color[:\s]*([A-Z])/i)?.[1],
              foundClarity: text.match(/clarity[:\s]*([A-Z0-9]+)/i)?.[1],
              foundCut: text.match(/cut[:\s]*([A-Za-z\s]+)/i)?.[1]
            };
            
            testResults.data = extractedData;
            break;
          }
          
        } catch (error) {
          testResults.tests[`directUrl_${i+1}`] = {
            success: false,
            url: url,
            error: error.message
          };
        }
      }
    }

    // Summary
    testResults.summary = {
      canAccessSite: testResults.tests.basicConnectivity?.success || false,
      foundDiamondData: testResults.success,
      recommendation: testResults.success ? 
        'StoneAlgo scraping appears possible! You can build your diamond cut score calculator.' : 
        'StoneAlgo scraping is blocked. Consider GIA API, PDF OCR, or manual entry instead.'
    };

    return res.status(200).json(testResults);

  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      message: "Function error"
    });
  }
}
