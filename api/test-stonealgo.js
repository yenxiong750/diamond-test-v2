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
    
    const testResults = {
      message: "🔬 REAL StoneAlgo Scraping Test Results",
      giaNumber: giaNumber || "test",
      timestamp: new Date().toISOString(),
      success: false,
      tests: {},
      data: null,
      errors: []
    };

    // Test 1: Basic StoneAlgo connectivity
    try {
      console.log('Testing StoneAlgo connectivity...');
      const response = await fetch('https://www.stonealgo.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const text = await response.text();
      
      testResults.tests.basicConnectivity = {
        success: response.ok,
        status: response.status,
        hasStoneAlgo: text.toLowerCase().includes('stonealgo'),
        hasDiamond: text.toLowerCase().includes('diamond'),
        hasGIA: text.toLowerCase().includes('gia'),
        contentLength: text.length
      };
      
      console.log(`✓ StoneAlgo connectivity: ${response.status}`);
      
    } catch (error) {
      console.log(`✗ StoneAlgo connectivity failed: ${error.message}`);
      testResults.tests.basicConnectivity = {
        success: false,
        error: error.message
      };
      testResults.errors.push(`StoneAlgo access failed: ${error.message}`);
    }

    // Test 2: GIA Number Direct URL Test
    if (giaNumber && giaNumber !== "test") {
      const testUrls = [
        `https://www.stonealgo.com/diamond-details/GIA-number-${giaNumber}`,
        `https://www.stonealgo.com/diamond-details/${giaNumber}`,
        `https://www.stonealgo.com/check/${giaNumber}`
      ];

      for (let i = 0; i < testUrls.length; i++) {
        const url = testUrls[i];
        try {
          console.log(`Testing URL ${i + 1}: ${url}`);
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          const text = await response.text();
          
          // Check for diamond data indicators
          const hasCarat = text.toLowerCase().includes('carat');
          const hasColor = text.toLowerCase().includes('color');
          const hasClarity = text.toLowerCase().includes('clarity');
          const hasCut = text.toLowerCase().includes('cut');
          const hasDiamondData = hasCarat && hasColor && hasClarity;
          
          // Check for errors
          const hasNotFound = text.toLowerCase().includes('not found') || 
                             text.toLowerCase().includes('404') ||
                             response.status === 404;
          
          const hasError = text.toLowerCase().includes('error') || hasNotFound;
          
          testResults.tests[`urlTest_${i + 1}`] = {
            success: response.ok && hasDiamondData && !hasError,
            url: url,
            status: response.status,
            hasCarat,
            hasColor,
            hasClarity,
            hasCut,
            hasDiamondData,
            hasError,
            hasNotFound,
            title: text.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() || 'No title found',
            contentLength: text.length
          };
          
          // If we found diamond data, try to extract some basic info
          if (hasDiamondData && !hasError) {
            console.log(`✓ SUCCESS: Found diamond data at ${url}`);
            testResults.success = true;
            
            // Try basic data extraction
            const extractedData = {
              foundCarat: text.match(/(\d+\.?\d*)\s*carat/i)?.[1] || null,
              foundColor: text.match(/color[:\s]*([A-Z])/i)?.[1] || null,
              foundClarity: text.match(/clarity[:\s]*([A-Z0-9]+)/i)?.[1] || null,
              foundCut: text.match(/cut[:\s]*([A-Za-z\s]+)/i)?.[1]?.trim() || null,
              sampleText: text.substring(0, 500) + '...'
            };
            
            testResults.data = extractedData;
            break; // Found working URL, stop testing others
          } else {
            console.log(`✗ No diamond data at ${url} (Status: ${response.status})`);
          }
          
        } catch (error) {
          console.log(`✗ URL test failed: ${url} - ${error.message}`);
          testResults.tests[`urlTest_${i + 1}`] = {
            success: false,
            url: url,
            error: error.message
          };
        }
      }
    }

    // Final assessment
    const canAccessSite = testResults.tests.basicConnectivity?.success || false;
    const foundDiamondData = testResults.success;
    
    testResults.summary = {
      overallSuccess: foundDiamondData,
      canAccessSite,
      foundDiamondData,
      recommendation: foundDiamondData ? 
        '🎉 SUCCESS! StoneAlgo scraping appears possible! You can build your diamond cut score calculator using their data.' : 
        '❌ StoneAlgo scraping is blocked or data not accessible. Consider alternatives: GIA API ($), PDF OCR, or manual data entry.'
    };

    console.log(`Final result: ${foundDiamondData ? 'SUCCESS' : 'BLOCKED'}`);
    
    return res.status(200).json(testResults);

  } catch (error) {
    console.log(`Function error: ${error.message}`);
    return res.status(500).json({ 
      error: error.message,
      message: "Function error during scraping test",
      timestamp: new Date().toISOString()
    });
  }
}
