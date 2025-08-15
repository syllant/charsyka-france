#!/usr/bin/env node

/**
 * Batch script to update international high schools data for all cities
 * Uses the French Ministry of Education API to fetch international high schools
 */

const fs = require('fs');
const path = require('path');
const frEducationInternationalHighSchools = require('./data-sources/fr-education-international-highschools');

// Configuration
const DATA_DIR = path.join(__dirname, '../src/data');

/**
 * Get all existing city files
 */
function getExistingCityFiles() {
  try {
    const files = fs.readdirSync(DATA_DIR);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .filter(cityId => cityId !== 'schema' && cityId !== 'index');
  } catch (error) {
    console.error('Error reading data directory:', error.message);
    return [];
  }
}

/**
 * Update international high schools for all cities
 */
async function updateAllCitiesInternationalHighSchools() {
  const cityFiles = getExistingCityFiles();

  if (cityFiles.length === 0) {
    console.log('❌ No city files found');
    return;
  }

  console.log(`🌍 Found ${cityFiles.length} cities to update:`);
  cityFiles.forEach(city => console.log(`  - ${city}`));
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const cityId of cityFiles) {
    try {
      console.log(`🌍 Updating international high schools for ${cityId}...`);
      await frEducationInternationalHighSchools.updateCityInternationalHighSchools(cityId);
      console.log(`✅ Successfully updated ${cityId}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error updating ${cityId}:`, error.message);
      errorCount++;
    }

    // Add a small delay between cities to be respectful to the API
    if (cityId !== cityFiles[cityFiles.length - 1]) {
      console.log('⏳ Waiting 2 seconds before next city...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('');
  }

  // Summary
  console.log('🎯 Update Summary:');
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
  console.log(`  📊 Total: ${cityFiles.length}`);

  if (errorCount > 0) {
    console.log('\n⚠️  Some cities failed to update. Check the error messages above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All cities updated successfully!');
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🌍 International High Schools Batch Update');
    console.log('=====================================');
    console.log('');

    await updateAllCitiesInternationalHighSchools();

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
