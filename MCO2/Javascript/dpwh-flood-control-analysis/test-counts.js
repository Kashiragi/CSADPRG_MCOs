const { readData } = require('./src/ingestion/readData');
const { validateData } = require('./src/ingestion/validateData');
const { cleanData } = require('./src/ingestion/cleanData');

(async () => {
  const raw = await readData();
  console.log('Raw CSV rows:', raw.length);
  
  const validation = validateData(raw);
  console.log('Valid rows after validation:', validation.validRows);
  console.log('Invalid rows:', validation.invalidRows);
  
  const clean = cleanData(validation.validData, {
    startYear: 2021,
    endYear: 2023,
    dropMissingCoords: true,
    logResults: false,
    originalCount: raw.length
  });
  
  console.log('Final rows (2021-2023, with coords):', clean.length);
  console.log('\nTarget: 7,275 rows');
  console.log('Difference:', clean.length - 7275);
})();
