const fs = require('fs');

const html = fs.readFileSync('./static/territory-report.html', 'utf8');
const data = fs.readFileSync('./static/territory-data.js', 'utf8');

const scriptTag = '<script>\n' + data + '\n</script>';
const combined = html.replace('<script src="territory-data.js"></script>', scriptTag);

fs.writeFileSync('./static/natoli-territory-report-netlify.html', combined);

const stats = fs.statSync('./static/natoli-territory-report-netlify.html');
console.log('Created: natoli-territory-report-netlify.html');
console.log('Size: ' + (stats.size / 1024 / 1024).toFixed(2) + ' MB');
console.log('');
console.log('To deploy to Netlify:');
console.log('1. Download this file');
console.log('2. Rename to index.html');
console.log('3. Create a folder and put index.html inside');
console.log('4. Drag the folder to Netlify');
