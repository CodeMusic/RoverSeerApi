// Proxy Connection Test Utility
// This script helps diagnose connection issues with Morty proxy
// Usage: node proxy_test.js <url-to-test>

const https = require('https');
const http = require('http');
const url = require('url');

function testConnection(targetUrl) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(targetUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    console.log(`Testing connection to: ${targetUrl}`);
    console.log(`Protocol: ${parsedUrl.protocol}`);
    console.log(`Host: ${parsedUrl.host}`);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SearXNG-Proxy-Test)',
        'Connection': 'close'
      },
      timeout: 10000
    };

    console.log(`\nSending request with headers:`);
    console.log(JSON.stringify(options.headers, null, 2));

    const req = client.request(options, (res) => {
      console.log(`\nResponse received:`);
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, JSON.stringify(res.headers, null, 2));

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\nResponse body length: ${data.length} bytes`);
        if (data.length < 500) {
          console.log(`Response body: ${data}`);
        } else {
          console.log(`Response body (first 500 chars): ${data.substring(0, 500)}...`);
        }

        resolve({
          success: true,
          statusCode: res.statusCode,
          headers: res.headers,
          bodyLength: data.length
        });
      });
    });

    req.on('timeout', () => {
      console.log('\nRequest timed out');
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.on('error', (err) => {
      console.log(`\nRequest failed: ${err.message}`);
      console.log(`Error code: ${err.code}`);

      // Check for specific connection errors
      if (err.code === 'ECONNRESET') {
        console.log('\nThis is a connection reset error. The server closed the connection before sending a response.');
        console.log('This often happens when servers don\'t properly handle HTTP/1.0 connections or have security policies.');
      } else if (err.code === 'ENOTFOUND') {
        console.log('\nDNS resolution failed. Check the hostname.');
      } else if (err.code === 'ECONNREFUSED') {
        console.log('\nConnection refused. The server is not accepting connections on this port.');
      }

      reject(err);
    });

    // Set a timeout
    req.setTimeout(10000);

    console.log('\nSending request...');
    req.end();
  });
}

// Test with different connection headers
async function testWithHeaders(targetUrl) {
  const testCases = [
    {
      name: 'Standard headers',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SearXNG-Proxy-Test)',
        'Connection': 'close'
      }
    },
    {
      name: 'Keep-alive headers',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SearXNG-Proxy-Test)',
        'Connection': 'keep-alive'
      }
    },
    {
      name: 'WordPress-like headers',
      headers: {
        'User-Agent': 'WordPress/6.0; https://example.com',
        'Connection': 'close'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== Testing with ${testCase.name} ===`);
    try {
      await testConnection(targetUrl, testCase.headers);
    } catch (error) {
      console.log(`Test failed: ${error.message}`);
    }
    console.log('Waiting 2 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Main execution
if (process.argv.length < 3) {
  console.log('Usage: node proxy_test.js <url-to-test>');
  console.log('Example: node proxy_test.js https://example.com');
  process.exit(1);
}

const targetUrl = process.argv[2];
testWithHeaders(targetUrl).catch(console.error);
