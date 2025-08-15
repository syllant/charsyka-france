/**
 * French Ministry of Education High Schools Data Source Module
 * Fetches high school data from the French Ministry of Education API
 * https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const DATA_DIR = path.join(__dirname, '../../src/data');
const FR_EDUCATION_BASE_URL = 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records';

// Rate limiting
const API_DELAY = 1000; // 1 second between requests

// User agent for API requests
const USER_AGENT = 'CharsykaFrance/1.0 (https://github.com/yourusername/charsyka-france)';

/**
 * Delay function for rate limiting
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get the correct city name for the French Education API
 * Some cities have different names in the API
 */
function getApiCityName(cityName) {
  const cityNameMap = {
    'marseille': 'Marseille',
    'aix-en-provence': 'Aix-en-Provence',
    'aix en provence': 'Aix-en-Provence',
    'aix': 'Aix-en-Provence',
    'lyon': 'Lyon',
    'bordeaux': 'Bordeaux',
    'nantes': 'Nantes',
    'montpellier': 'Montpellier'
  };

  const normalizedCityName = cityName.toLowerCase().trim();
  return cityNameMap[normalizedCityName] || cityName.charAt(0).toUpperCase() + cityName.slice(1);
}

/**
 * Search for high schools in a city using the French Ministry of Education API
 */
async function searchHighSchools(cityName) {
  try {
    // Rate limiting
    await delay(API_DELAY);

    // Get the correct city name for the API
    const apiCityName = getApiCityName(cityName);
    console.log(`Searching for high schools in API city: ${apiCityName}`);

    // Build the query to search for high schools in the specified city
    const queryParams = {
      where: `nom_commune='${apiCityName}' AND type_etablissement='Lycée'`,
      limit: 100
    };

    const response = await axios.get(FR_EDUCATION_BASE_URL, {
      params: queryParams,
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000
    });

    if (!response.data || !response.data.results) {
      console.log(`No high school data found for ${cityName}`);
      return [];
    }

    console.log(`Found ${response.data.results.length} high schools in ${cityName}`);
    return response.data.results;

  } catch (error) {
    console.error(`Error searching for high schools in ${cityName}:`, error.message);
    return [];
  }
}

/**
 * Create high school object from French Education API data
 */
function createHighSchoolObject(highSchool) {
  // Extract coordinates if available
  let coordinates = null;
  if (highSchool.latitude && highSchool.longitude) {
    coordinates = [parseFloat(highSchool.latitude), parseFloat(highSchool.longitude)];
  }

  // Build address string
  const addressParts = [];
  if (highSchool.adresse) addressParts.push(highSchool.adresse);
  if (highSchool.code_postal) addressParts.push(highSchool.code_postal);
  if (highSchool.nom_commune) addressParts.push(highSchool.nom_commune);
  const address = addressParts.join(', ');

      return {
      name: highSchool.nom_etablissement || highSchool.nom || 'Unnamed High School',
      address: address,
      coordinates: coordinates,
      website: highSchool.web || null,
      // Include both the original external fields and the schema-required fields
      externalId: highSchool.identifiant_de_l_etablissement || highSchool.id,
      externalType: 'fr-education',
      externalUrl: `https://data.education.gouv.fr/pages/fiche-etablissement/?code_etab=${highSchool.identifiant_de_l_etablissement || highSchool.id}&type_etablissement=Lycée&selection=${encodeURIComponent(highSchool.nom_etablissement || highSchool.nom || '')}&code_postal=${highSchool.code_postal || ''}`,
      // Schema-required fields for compatibility
      osmId: `fr-education:${highSchool.identifiant_de_l_etablissement || highSchool.id}`,
      osmType: 'fr-education',
      lastUpdated: new Date().toISOString(),
      type: highSchool.type_etablissement || 'Lycée',
      dataSource: 'French Ministry of Education'
    };
}

/**
 * Update city high schools data using French Education API
 */
async function updateCityHighSchools(cityName) {
  const cityFile = path.join(DATA_DIR, `${cityName}.json`);

  if (!fs.existsSync(cityFile)) {
    throw new Error(`City file not found: ${cityFile}`);
  }

  // Read existing city data
  const cityData = JSON.parse(fs.readFileSync(cityFile, 'utf8'));

  // Search for high schools using French Education API
  const highSchools = await searchHighSchools(cityName);

  if (highSchools.length > 0) {
    // Create high school objects
    const highSchoolObjects = highSchools.map(highSchool => createHighSchoolObject(highSchool));

    // Update high schools array
    if (!cityData.education) {
      cityData.education = {};
    }
    cityData.education.highSchools = highSchoolObjects;

    // Update count metrics if they exist
    if (cityData.education.highSchoolsCount !== undefined) {
      cityData.education.highSchoolsCount = highSchoolObjects.length;
    }

    console.log(`Updated high schools for ${cityName}: ${highSchoolObjects.length} found`);

  } else {
    // Clear high schools data if none found
    if (!cityData.education) {
      cityData.education = {};
    }
    cityData.education.highSchools = [];
    if (cityData.education.highSchoolsCount !== undefined) {
      cityData.education.highSchoolsCount = 0;
    }
    console.log(`No high schools found for ${cityName}, cleared high schools data`);
  }

  // Write updated data back to file
  fs.writeFileSync(cityFile, JSON.stringify(cityData, null, 2));
}

module.exports = {
  updateCityHighSchools
};

// Allow running this script independently
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node fr-education-highschools.js <city-name>');
    console.log('Example: node fr-education-highschools.js lyon');
    process.exit(1);
  }

  const cityName = args[0];
  console.log(`🏫 Updating high schools for ${cityName}...`);

  updateCityHighSchools(cityName)
    .then(() => {
      console.log('✅ High schools update completed!');
    })
    .catch((error) => {
      console.error('❌ Error updating high schools:', error.message);
      process.exit(1);
    });
}
