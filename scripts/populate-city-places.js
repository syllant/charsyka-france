#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import data source modules
const frEsrUniversities = require('./data-sources/fr-esr-universities');
const frEducationHighSchools = require('./data-sources/fr-education-highschools');
const frEducationInternationalHighSchools = require('./data-sources/fr-education-international-highschools');
const frCulturePlaces = require('./data-sources/fr-culture-places');
const osmPlaces = require('./data-sources/osm-places');
const osmHikes = require('./data-sources/osm-hikes');

















// Main function to populate city data
async function populateCityData(cityName) {
  console.log(`🏙️  Starting population of places for ${cityName}...`);

  const cityData = {
    education: {},
    culture: {},
    geography: {}
  };

  // Use French higher education API for universities
  console.log(`🎓 Fetching universities using French higher education API...`);
  await frEsrUniversities.updateCityUniversities(cityName);

  // Use French Ministry of Education API for high schools
  console.log(`🏫 Fetching high schools using French Ministry of Education API...`);
  await frEducationHighSchools.updateCityHighSchools(cityName);

  // Use French Ministry of Education API for international high schools
  console.log(`🌍 Fetching international high schools using French Ministry of Education API...`);
  await frEducationInternationalHighSchools.updateCityInternationalHighSchools(cityName);

  // Use French Ministry of Culture API for cultural places
  console.log(`🎭 Fetching cultural places using French Ministry of Culture API...`);
  await frCulturePlaces.updateCityCulturalPlaces(cityData, cityName);

  // Use OpenStreetMap for other places
  console.log(`🗺️  Fetching other places using OpenStreetMap...`);
  await osmPlaces.updateCityPlaces(cityName);

  // Use OpenStreetMap for hiking trails
  console.log(`🥾 Fetching hiking trails using OpenStreetMap...`);
  await osmHikes.updateCityHikes(cityName);

  // Read the updated city data to return
  const cityFile = path.join(__dirname, '..', 'src', 'data', `${cityName.toLowerCase().replace(/\s+/g, '-')}.json`);
  if (fs.existsSync(cityFile)) {
    const content = fs.readFileSync(cityFile, 'utf8');
    return JSON.parse(content);
  }

  return cityData;
}



// Function to update city file
async function updateCityFile(cityName) {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const filePath = path.join(dataDir, `${cityName.toLowerCase().replace(/\s+/g, '-')}.json`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ City file not found: ${filePath}`);
    return;
  }

  try {
    console.log(`📖 Updating all data for ${cityName}...`);

    // Populate all data using the appropriate APIs
    await populateCityData(cityName);

    console.log(`\n🎉 Successfully updated ${filePath}`);

  } catch (error) {
    console.error(`❌ Error updating city file:`, error.message);
  }
}

// Function to update only specific data sources
async function updateCityFileSpecificSources(cityName, dataSources) {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const filePath = path.join(dataDir, `${cityName.toLowerCase().replace(/\s+/g, '-')}.json`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ City file not found: ${filePath}`);
    return;
  }

  try {
    console.log(`📖 Updating specific data sources for ${cityName}: ${dataSources.join(', ')}`);

    // Read existing city data
    const cityData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Update only the specified data sources
    for (const source of dataSources) {
      switch (source) {
        case '--universities-only':
          console.log(`🎓 Updating universities...`);
          await frEsrUniversities.updateCityUniversities(cityName);
          break;
        case '--high-schools-only':
          console.log(`🏫 Updating high schools...`);
          await frEducationHighSchools.updateCityHighSchools(cityName);
          break;
        case '--international-high-schools-only':
          console.log(`🌍 Updating international high schools...`);
          await frEducationInternationalHighSchools.updateCityInternationalHighSchools(cityName);
          break;
        case '--cultural-places-only':
          console.log(`🎭 Updating all cultural places...`);
          await frCulturePlaces.updateCityCulturalPlaces(cityData, cityName);
          break;
        case '--museums-only':
          console.log(`🏛️  Updating museums...`);
          await frCulturePlaces.updateCityCulturalPlaces(cityData, cityName, ['museums']);
          break;
        case '--cinemas-only':
          console.log(`🎬 Updating cinemas...`);
          await frCulturePlaces.updateCityCulturalPlaces(cityData, cityName, ['cinemas']);
          break;
        case '--theaters-only':
          console.log(`🎭 Updating theaters...`);
          await frCulturePlaces.updateCityCulturalPlaces(cityData, cityName, ['theaters']);
          break;
        case '--operas-only':
          console.log(`🎵 Updating operas...`);
          await frCulturePlaces.updateCityCulturalPlaces(cityData, cityName, ['operas']);
          break;
        // Beaches and ski resorts have been removed from the system
        case '--osm-only':
          console.log(`🗺️  Updating all OSM places...`);
          await osmPlaces.updateCityPlaces(cityName);
          break;
        case '--hikes-only':
          console.log(`🥾 Updating hiking trails...`);
          await osmHikes.updateCityHikes(cityName);
          break;
        default:
          console.log(`⚠️  Unknown data source: ${source}`);
      }
    }

    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(cityData, null, 2));
    console.log(`\n🎉 Successfully updated ${filePath}`);

  } catch (error) {
    console.error(`❌ Error updating city file:`, error.message);
  }
}

// Function to get all existing city files
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
          path: filePath
        });
      }
    } catch (error) {
      console.error(`⚠️  Error reading ${file}:`, error.message);
    }
  }

  return cities;
}

// Function to update all existing cities
async function updateAllCities() {
  const cities = getExistingCityFiles();

  if (cities.length === 0) {
    console.log('❌ No city files found to update');
    return;
  }

  console.log(`🏙️  Found ${cities.length} cities to update:`);
  cities.forEach(city => console.log(`   - ${city.name}`));
  console.log('');

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    console.log(`\n📊 Progress: [${i + 1}/${cities.length}] Processing ${city.name}...`);

    try {
      await updateCityFile(city.name);
      results.push({ city: city.name, success: true });
    } catch (error) {
      console.error(`❌ Failed to update ${city.name}:`, error.message);
      results.push({ city: city.name, success: false, error: error.message });
    }

    // Add delay between cities to avoid overwhelming the APIs
    if (i < cities.length - 1) {
      console.log('⏳ Waiting 5 seconds before next city...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  const endTime = Date.now();
  const totalTime = Math.round((endTime - startTime) / 1000);

  // Show results
  console.log('\n🎉 All Cities Update Complete!\n');

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
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('🚀 No arguments specified. Usage:');
    console.log('  node scripts/populate-city-places.js <city-name> [data-sources]');
    console.log('  node scripts/populate-city-places.js <city-name> --universities-only');
    console.log('  node scripts/populate-city-places.js <city-name> --high-schools-only');
    console.log('  node scripts/populate-city-places.js <city-name> --international-high-schools-only');
    console.log('  node scripts/populate-city-places.js <city-name> --cultural-places-only');
    console.log('  node scripts/populate-city-places.js <city-name> --museums-only');
    console.log('  node scripts/populate-city-places.js <city-name> --cinemas-only');
    console.log('  node scripts/populate-city-places.js <city-name> --theaters-only');
    console.log('  node scripts/populate-city-places.js <city-name> --operas-only');
      // Beaches and ski resorts commands removed
    console.log('  node scripts/populate-city-places.js <city-name> --osm-only');
    console.log('  node scripts/populate-city-places.js <city-name> --hikes-only');
    console.log('  node scripts/populate-city-places.js --all-cities');
    return;
  }

  if (args[0] === '--all-cities') {
    console.log('🚀 Updating all existing cities...');
    await updateAllCities();
  } else {
    const cityName = args[0];
    const dataSources = args.slice(1);

    console.log(`🚀 Starting population for city: ${cityName}`);

    if (dataSources.length === 0) {
      // No specific data sources specified, update everything
    await updateCityFile(cityName);
    } else {
      // Update only specific data sources
      await updateCityFileSpecificSources(cityName, dataSources);
    }
  }

  console.log('\n✨ Process completed!');
}

// Run the script
main().catch(console.error);
