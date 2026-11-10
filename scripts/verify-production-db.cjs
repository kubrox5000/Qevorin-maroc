const http = require('http');

async function checkProductionDb() {
  const req = http.request('http://127.0.0.1:3000/api/db/status', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.error(e, body);
      }
    });
  });
  req.end();
}

checkProductionDb();
