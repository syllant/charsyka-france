/**
 * French Higher Education Data Source Module
 * Fetches university data from the French Ministry of Higher Education API
 * https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-principaux-etablissements-enseignement-superieur/records
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const DATA_DIR = path.join(__dirname, '../../src/data');
const FR_ESR_BASE_URL = 'https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-principaux-etablissements-enseignement-superieur/records';

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
 * Get the correct city name for the French higher education API
 * Some cities have different names in the API
 */
function getApiCityName(cityName) {
  const cityNameMap = {
    'marseille': 'Marseille-Aix-en-Provence',
    'aix-en-provence': 'Marseille-Aix-en-Provence',
    'aix en provence': 'Marseille-Aix-en-Provence',
    'aix': 'Marseille-Aix-en-Provence'
  };

  const normalizedCityName = cityName.toLowerCase().trim();
  return cityNameMap[normalizedCityName] || cityName.charAt(0).toUpperCase() + cityName.slice(1);
}

/**
 * Search for universities in a city using the French higher education API
 */
async function searchUniversities(cityName) {
  try {
    // Rate limiting
    await delay(API_DELAY);

    // Get the correct city name for the API
    const apiCityName = getApiCityName(cityName);
    console.log(`Searching for universities in API city: ${apiCityName}`);

    // Build the query to search for universities in the specified city
    const queryParams = {
      where: `uucr_nom='${apiCityName}'`,
      limit: 100
    };

        const response = await axios.get(FR_ESR_BASE_URL, {
      params: queryParams,
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000
    });

    if (!response.data || !response.data.results) {
      console.log(`No university data found for ${cityName}`);
      return [];
    }

    console.log(`Found ${response.data.results.length} universities in ${cityName}`);
    return response.data.results;

  } catch (error) {
    console.error(`Error searching for universities in ${cityName}:`, error.message);
    return [];
  }
}

/**
 * Create university object from French higher education API data
 */
function createUniversityObject(university) {
  // Extract coordinates from the coordonnees object
  let coordinates = null;
  if (university.coordonnees && university.coordonnees.lat && university.coordonnees.lon) {
    coordinates = [parseFloat(university.coordonnees.lat), parseFloat(university.coordonnees.lon)];
  }

  // Build address string
  const addressParts = [];
  if (university.adresse_uai) addressParts.push(university.adresse_uai);
  if (university.code_postal_uai) addressParts.push(university.code_postal_uai);
  if (university.localite_acheminement_uai) addressParts.push(university.localite_acheminement_uai);
  const address = addressParts.join(', ');

      return {
      name: university.uo_lib || university.nom_court || 'Unnamed University',
      address: address,
      coordinates: coordinates,
      website: university.url || null,
      // Schema-required fields for compatibility
      osmId: `fr-esr:${university.uucr_id}`,
      osmType: 'fr-esr',
      lastUpdated: new Date().toISOString(),
      type: university.type_d_etablissement ? university.type_d_etablissement.join(', ') : null,
      dataSource: 'French Ministry of Higher Education'
    };
}

/**
 * Update city universities data using French higher education API
 */
async function updateCityUniversities(cityName) {
  const cityFile = path.join(DATA_DIR, `${cityName}.json`);

  if (!fs.existsSync(cityFile)) {
    throw new Error(`City file not found: ${cityFile}`);
  }

  // Read existing city data
  const cityData = JSON.parse(fs.readFileSync(cityFile, 'utf8'));

  // Search for universities using French higher education API
  const universities = await searchUniversities(cityName);

  if (universities.length > 0) {
    // Create university objects
    const universityObjects = universities.map(university => createUniversityObject(university));

    // Update universities array
    if (!cityData.education) {
      cityData.education = {};
    }
    cityData.education.universities = universityObjects;

    // Update count metrics if they exist
    if (cityData.education.universitiesCount !== undefined) {
      cityData.education.universitiesCount = universityObjects.length;
    }

    console.log(`Updated universities for ${cityName}: ${universityObjects.length} found`);

  } else {
    // Clear universities data if none found
    if (!cityData.education) {
      cityData.education = {};
    }
    cityData.education.universities = [];
    if (cityData.education.universitiesCount !== undefined) {
      cityData.education.universitiesCount = 0;
    }
    console.log(`No universities found for ${cityName}, cleared universities data`);
  }

  // Write updated data back to file
  fs.writeFileSync(cityFile, JSON.stringify(cityData, null, 2));
}

module.exports = {
  updateCityUniversities
};

// Allow running this script independently
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node fr-esr-universities.js <city-name>');
    console.log('Example: node fr-esr-universities.js lyon');
    process.exit(1);
  }

  const cityName = args[0];
  console.log(`🎓 Updating universities for ${cityName}...`);

  updateCityUniversities(cityName)
    .then(() => {
      console.log('✅ Universities update completed!');
    })
    .catch((error) => {
      console.error('❌ Error updating universities:', error.message);
      process.exit(1);
    });
}
