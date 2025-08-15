#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const frEducationHighSchools = require('./data-sources/fr-education-highschools');

/**
 * Get all existing city files
 */
function getExistingCityFiles() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

  const cities = [];
  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const cityData = JSON.parse(content);

      // Skip schema and non-city files
      if (cityData.name && cityData.name !== 'Schema') {
        cities.push({
          name: cityData.name,
          file: file,
          path: filePath,
          slug: file.replace('.json', '')
        });
      }
    } catch (error) {
      console.error(`⚠️  Error reading ${file}:`, error.message);
    }
  }

  return cities;
}

/**
 * Update high schools for all cities
 */
async function updateAllCitiesHighSchools() {
  const cities = getExistingCityFiles();

  if (cities.length === 0) {
    console.log('❌ No city files found to update');
    return;
  }

  console.log(`🏫 Found ${cities.length} cities to update with high school data:`);
  cities.forEach(city => console.log(`   - ${city.name}`));
  console.log('');

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    console.log(`\n📊 Progress: [${i + 1}/${cities.length}] Processing ${city.name}...`);

    try {
      await frEducationHighSchools.updateCityHighSchools(city.slug);
      results.push({ city: city.name, success: true });
    } catch (error) {
      console.error(`❌ Failed to update ${city.name}:`, error.message);
      results.push({ city: city.name, success: false, error: error.message });
    }

    // Add delay between cities to avoid overwhelming the API
    if (i < cities.length - 1) {
      console.log('⏳ Waiting 2 seconds before next city...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const endTime = Date.now();
  const totalTime = Math.round((endTime - startTime) / 1000);

  // Show results
  console.log('\n🎉 All Cities High Schools Update Complete!\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`📊 Results Summary:`);
  console.log(`   ✅ Successful: ${successful.length}/${results.length}`);
  console.log(`   ❌ Failed: ${failed.length}/${results.length}`);
  console.log(`   ⏱️  Total time: ${totalTime} seconds`);

  if (successful.length > 0) {
    console.log('\n✅ Successfully updated:');
    successful.forEach(r => console.log(`   - ${r.city}`));
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed to update:');
    failed.forEach(r => console.log(`   - ${r.city}: ${r.error}`));
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting high schools update for all cities...');
  await updateAllCitiesHighSchools();
  console.log('\n✨ Process completed!');
}

// Run the script
main().catch(console.error);
