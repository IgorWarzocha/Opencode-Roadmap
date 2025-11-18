const { RoadmapValidator } = require('./dist/storage.js');

console.log('Testing validateTitle...');
const result = RoadmapValidator.validateTitle('', 'feature');
console.log('Result:', JSON.stringify(result, null, 2));