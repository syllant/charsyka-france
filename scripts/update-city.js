#!/usr/bin/env node

/**
 * Modular City Updater Script
 *
 * This script coordinates updates from different data sources:
 * - OpenStreetMap (places)
 * - AllTrails (hikes)
 * - Future sources (weather, demographics, etc.)
 *
 * Usage:
 *   node scripts/update-city.js [cityName]
 *   node scripts/update-city.js                    # Update all cities
 *   node scripts/update-city.js "Aix-en-Provence"  # Update specific city
 */

const fs = require('fs');
const path = require('path');

// Import data source modules
const { updateCityPlaces } = require('./data-sources/places.js');
const { updateCityHikes } = require('./data-sources/hikes.js');

// Configuration
const DATA_DIR = path.join(__dirname, '../src/data');
const CITIES = [
  'aix-en-provence',
  'bordeaux',
  'lyon',
  'marseille',
  'montpellier',
  'nantes',
  'oakland'
];

/**
 * Get all city files in the data directory
 */
function getExistingCityFiles() {
  const files = fs.readdirSync(DATA_DIR)
    .filter(file => file.endsWith('.json') && file !== 'schema.json' && file !== 'index.js')
    .map(file => file.replace('.json', ''));

  return files;
}

/**
 * Update a single city with all data sources
 */
async function updateCity(cityName) {
  console.log(`\n🏙️  Updating city: ${cityName}`);
  console.log('=' .repeat(50));

  try {
    // Update places from OpenStreetMap
    console.log('\n📍 Updating places from OpenStreetMap...');
    await updateCityPlaces(cityName);

    // Update hikes from AllTrails
    console.log('\n🥾 Updating hikes from AllTrails...');
    await updateCityHikes(cityName);

    // Future data sources can be added here
    // await updateCityWeather(cityName);
    // await updateCityDemographics(cityName);

    console.log(`\n✅ City ${cityName} updated successfully!`);

  } catch (error) {
    console.error(`\n❌ Error updating city ${cityName}:`, error.message);
    throw error;
  }
}

/**
 * Update all existing cities
 */
async function updateAllCities() {
  const cityFiles = getExistingCityFiles();
  console.log(`\n🌍 Updating ${cityFiles.length} cities...`);

  for (const cityName of cityFiles) {
    try {
      await updateCity(cityName);

      // Add delay between cities to avoid overwhelming APIs
      if (cityFiles.indexOf(cityName) < cityFiles.length - 1) {
        console.log('\n⏳ Waiting 5 seconds before next city...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`\n⚠️  Skipping ${cityName} due to error, continuing with next city...`);
      continue;
    }
  }

  console.log(`\n🎉 All cities updated!`);
}

/**
 * Main function
 */
async function main() {
  const cityName = process.argv[2];

  try {
    if (cityName) {
      // Update specific city
      await updateCity(cityName);
    } else {
      // Update all cities
      await updateAllCities();
    }
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  updateCity,
  updateAllCities,
  getExistingCityFiles
};
