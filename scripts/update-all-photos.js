#!/usr/bin/env node

const { updateAllCities } = require('./data-sources/pexels-photos');

console.log('🖼️  Starting Pexels photo update for all cities...');
console.log('This will fetch real, city-specific images for banners and galleries.');
console.log('');

updateAllCities()
  .then(() => {
    console.log('\n✨ Photo update completed successfully!');
    console.log('All cities now have real, relevant images from Pexels.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Photo update failed:', error.message);
    process.exit(1);
  });
