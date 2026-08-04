const { generateExecutivePDF } = require('../src/services/pdf');
const fs = require('fs');
const path = require('path');

async function test() {
  console.log('Testing generateExecutivePDF()...');
  const pdfBuf = await generateExecutivePDF();
  console.log('Generated PDF Buffer:', pdfBuf.length, 'bytes');

  const outputPath = path.join(__dirname, 'test_output.pdf');
  fs.writeFileSync(outputPath, pdfBuf);
  console.log('PDF saved to:', outputPath);
}

test().catch(e => console.error('Error:', e.message));
