#!/usr/bin/env node

/**
 * Update weather data for all cities using OpenWeatherMap API
 * This script updates the weather section of all city JSON files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateAllCitiesWeather } from './data-sources/open-meteo-weather.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to city data files
const CITIES_DIR = path.join(__dirname, '../src/data');

/**
 * Load all city data files
 */
async function loadAllCities() {
  try {
    const files = await fs.readdir(CITIES_DIR);
    const cityFiles = files.filter(file => file.endsWith('.json') && file !== 'schema.json');

    const cities = [];
    for (const file of cityFiles) {
      const filePath = path.join(CITIES_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      const cityData = JSON.parse(content);
      cities.push(cityData);
    }

    return cities;
  } catch (error) {
    console.error('Error loading city files:', error);
    return [];
  }
}

/**
 * Update weather data for a specific city file
 */
async function updateCityWeatherFile(cityId, weatherData) {
  try {
    const filePath = path.join(CITIES_DIR, `${cityId}.json`);
    const content = await fs.readFile(filePath, 'utf8');
    const cityData = JSON.parse(content);

    // Update weather section
    cityData.weather = weatherData;

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(cityData, null, 2));
    console.log(`✅ Updated weather data for ${cityData.name}`);

    return true;
  } catch (error) {
    console.error(`❌ Error updating ${cityId}:`, error.message);
    return false;
  }
}

/**
 * Main function to update all cities
 */
async function main() {
  console.log('🌤️  Starting weather data update for all cities...\n');

    // No API key required with Open-Meteo!
  console.log('✅ Using Open-Meteo Historical API - completely free, no API key needed!');

  // Load all cities
  const cities = await loadAllCities();
  if (cities.length === 0) {
    console.error('❌ No city files found');
    process.exit(1);
  }

  console.log(`📊 Found ${cities.length} city files to update\n`);

  // Update weather data for all cities
  const weatherResults = await updateAllCitiesWeather(cities);

  if (Object.keys(weatherResults).length === 0) {
    console.error('❌ No weather data was fetched');
    process.exit(1);
  }

  console.log('\n📝 Updating city files with new weather data...\n');

  // Update each city file
  let successCount = 0;
  let errorCount = 0;

  for (const city of cities) {
    if (weatherResults[city.id]) {
      const success = await updateCityWeatherFile(city.id, weatherResults[city.id]);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    } else {
      console.log(`⚠️  No weather data available for ${city.name}`);
      errorCount++;
    }
  }

  console.log('\n📊 Weather update summary:');
  console.log(`   ✅ Successfully updated: ${successCount} cities`);
  console.log(`   ❌ Failed to update: ${errorCount} cities`);
  console.log(`   📁 Total cities processed: ${cities.length}`);

  if (successCount > 0) {
    console.log('\n🎉 Weather data update completed successfully!');
    console.log('   The city files now contain more accurate weather metrics.');
  } else {
    console.log('\n❌ Weather data update failed for all cities');
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
