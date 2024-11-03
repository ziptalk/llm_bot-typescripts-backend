// copyJson.js
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'src', 'data', 'testData.json');
const destinationPath = path.join(__dirname, 'dist', 'data', 'testData.json');

// dist/data 디렉토리가 없으면 생성
fs.mkdirSync(path.dirname(destinationPath), { recursive: true });

// JSON 파일 복사
fs.copyFileSync(sourcePath, destinationPath);
console.log(`Copied testData.json to ${destinationPath}`);
