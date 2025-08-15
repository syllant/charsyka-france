/**
 * Places Data Source Module
 * Fetches place data from OpenStreetMap and Wikidata
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const DATA_DIR = path.join(__dirname, '../../src/data');
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_BASE_URL = 'https://overpass-api.de/api/interpreter';
const WIKIDATA_BASE_URL = 'https://www.wikidata.org/w/api.php';

// Rate limiting
const NOMINATIM_DELAY = 1000; // 1 second
const WIKIDATA_DELAY = 500;   // 500ms

/**
 * Delay function for rate limiting
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search for places using Overpass API with proper OSM tags
 */
async function searchPlaces(cityName, placeType) {
  // Get city coordinates first
  const cityCoords = await getCityCoordinates(cityName);
  if (!cityCoords) {
    console.error(`Could not get coordinates for ${cityName}`);
    return [];
  }

  // Define OSM tag queries for different place types
  const tagQueries = {
    // High schools and international schools are now handled by French Ministry of Education API
    // Beaches and ski resorts have been removed from the system
  };

  const tagQuery = tagQueries[placeType];
  if (!tagQuery) {
    console.error(`No tag query defined for place type: ${placeType}`);
    return [];
  }

      // Build Overpass query to search within city bounds
  // Use a large radius to cover the entire Lyon metropolitan area
  let query;

 if (placeType === 'high school') {
    query = `
      [out:json][timeout:25];
      (
        node["amenity"="school"]["school"="secondary"](around:25000,${cityCoords.lat},${cityCoords.lon});
        way["amenity"="school"]["school"="secondary"](around:25000,${cityCoords.lat},${cityCoords.lon});
        relation["amenity"="school"]["school"="secondary"](around:25000,${cityCoords.lat},${cityCoords.lon});
      );
      out center;
    `;
  } else if (placeType === 'beach') {
    query = `
      [out:json][timeout:25];
      (
        node["natural"="beach"](around:25000,${cityCoords.lat},${cityCoords.lon});
        way["natural"="beach"](around:25000,${cityCoords.lat},${cityCoords.lon});
        relation["natural"="beach"](around:25000,${cityCoords.lat},${cityCoords.lon});
      );
      out center;
    `;
  } else if (placeType === 'ski resort') {
    query = `
      [out:json][timeout:25];
      (
        node["leisure"="sports_centre"]["sport"="skiing"](around:25000,${cityCoords.lat},${cityCoords.lon});
        way["leisure"="sports_centre"]["sport"="skiing"](around:25000,${cityCoords.lat},${cityCoords.lon});
        relation["leisure"="sports_centre"]["sport"="skiing"](around:25000,${cityCoords.lat},${cityCoords.lon});
      );
      out center;
    `;
  } else {
    // Fallback for other types
    query = `
      [out:json][timeout:25];
      (
        node["${tagQuery}"](around:25000,${cityCoords.lat},${cityCoords.lon});
        way["${tagQuery}"](around:25000,${cityCoords.lat},${cityCoords.lon});
        relation["${tagQuery}"](around:25000,${cityCoords.lat},${cityCoords.lon});
      );
      out center;
    `;
  }

  try {
    const response = await axios.post(OVERPASS_BASE_URL, query, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

          if (response.data.elements && response.data.elements.length > 0) {
        // Filter and convert to place objects
        const places = response.data.elements
          .filter(element => {
            return element.type === 'node' || element.type === 'way' || element.type === 'relation';
          })
          .filter(element => {
            // Ensure element has tags
            if (!element.tags) return false;

            // Additional filtering based on place type
            if (placeType === 'high school') {
              // For high schools, ensure it has the school tag and is secondary level
              return element.tags.amenity === 'school' &&
                     element.tags.school === 'secondary' &&
                     element.tags.name;
            }

            // For other types, just ensure they have a name
            return element.tags.name;
          })
          .map(element => {
            // Handle different element types
            let lat, lon;
            if (element.type === 'node') {
              lat = element.lat;
              lon = element.lon;
            } else if (element.type === 'way' && element.center) {
              lat = element.center.lat;
              lon = element.center.lon;
            } else if (element.type === 'relation' && element.center) {
              lat = element.center.lat;
              lon = element.center.lon;
            } else {

              // Skip elements without coordinates
              return null;
            }

            return {
              osm_id: element.id,
              osm_type: element.type,
              lat: lat,
              lon: lon,
              display_name: element.tags.name || element.tags['name:en'] || 'Unnamed place',
              tags: element.tags
            };
          })
          .filter(place => place !== null); // Remove null entries

        return places;
      }
    return [];
  } catch (error) {
    console.error(`Error searching for ${placeType} in ${cityName}:`, error.message);
    return [];
  }
}

/**
 * Get city coordinates from existing city data files
 */
async function getCityCoordinates(cityName) {
  const cityFile = path.join(DATA_DIR, `${cityName}.json`);

  if (!fs.existsSync(cityFile)) {
    console.error(`City file not found: ${cityFile}`);
    return null;
  }

  try {
    const cityData = JSON.parse(fs.readFileSync(cityFile, 'utf8'));

    // Try to get coordinates from the city data
    if (cityData.coordinates && cityData.coordinates.length >= 2) {
      return {
        lat: cityData.coordinates[0],
        lon: cityData.coordinates[1]
      };
    }

    // Fallback: try to get from a place in the city
    if (cityData.geography && cityData.geography.beaches && cityData.geography.beaches.length > 0) {
      const beach = cityData.geography.beaches[0];
      if (beach.coordinates && beach.coordinates.length >= 2) {
        return {
          lat: beach.coordinates[0],
          lon: beach.coordinates[1]
        };
      }
    }

    console.error(`No coordinates found for ${cityName}`);
    return null;
  } catch (error) {
    console.error(`Error reading city file for ${cityName}:`, error.message);
    return null;
  }
}

/**
 * Get detailed place information using Overpass API
 */
async function getPlaceDetails(osmId, placeType) {
  const query = `
    [out:json][timeout:25];
    ${osmId};
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await axios.post(OVERPASS_BASE_URL, query, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (response.data.elements && response.data.elements.length > 0) {
      return response.data.elements[0];
    }
    return null;
  } catch (error) {
    console.error(`Error getting details for OSM ID ${osmId}:`, error.message);
    return null;
  }
}

/**
 * Get website from Wikidata
 */
async function getWikidataWebsite(placeName, cityName) {
  const query = `${placeName} ${cityName} France`;
  const url = `${WIKIDATA_BASE_URL}?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&limit=5`;

  try {
    await delay(WIKIDATA_DELAY);
    const response = await axios.get(url);

    if (response.data.search && response.data.search.length > 0) {
      const entityId = response.data.search[0].id;
      return await getWikidataEntity(entityId);
    }
    return null;
  } catch (error) {
    console.error(`Error searching Wikidata for ${placeName}:`, error.message);
    return null;
  }
}

/**
 * Get entity details from Wikidata
 */
async function getWikidataEntity(entityId) {
  const url = `${WIKIDATA_BASE_URL}?action=wbgetentities&ids=${entityId}&props=claims&format=json`;

  try {
    await delay(WIKIDATA_DELAY);
    const response = await axios.get(url);

    if (response.data.entities && response.data.entities[entityId]) {
      const entity = response.data.entities[entityId];
      const claims = entity.claims;

      // Check for official website (P856) or website (P973)
      if (claims.P856 && claims.P856[0]) {
        return claims.P856[0].mainsnak.datavalue.value;
      } else if (claims.P973 && claims.P973[0]) {
        return claims.P973[0].mainsnak.datavalue.value;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error getting Wikidata entity ${entityId}:`, error.message);
    return null;
  }
}

/**
 * Create place object from OSM data
 */
async function createPlaceObject(place, placeType, cityName) {
  // Get website from Wikidata if not available in OSM
  let website = place.website || place.url;
  if (!website) {
    website = await getWikidataWebsite(place.display_name, cityName);
  }

  // Extract name from OSM tags or fallback to display name
  let name = place.tags.name || place.tags['name:en'] || place.tags['name:fr'] || place.display_name.split(',')[0];

  // For schools, try to get more specific names
  if (placeType === 'high school' && place.tags.name) {
    name = place.tags.name;
  } else if (placeType === 'university' && place.tags.name) {
    name = place.tags.name;
  }

  return {
    name: name,
    address: place.display_name,
    coordinates: [parseFloat(place.lat), parseFloat(place.lon)],
    website: website
  };
}

/**
 * Update city places data
 */
async function updateCityPlaces(cityName, specificPlaceTypes = null) {
  const cityFile = path.join(DATA_DIR, `${cityName}.json`);

  if (!fs.existsSync(cityFile)) {
    throw new Error(`City file not found: ${cityFile}`);
  }

  // Read existing city data
  const cityData = JSON.parse(fs.readFileSync(cityFile, 'utf8'));

  // Define place types to search for
  // Note: Cultural places (museums, cinemas, theaters) are now handled by French Ministry of Culture API
// Note: Beaches and ski resorts have been removed from the system
const allPlaceTypes = [
  // No place types handled by OSM anymore - keeping script structure for potential future use
];

  // Use specific place types if provided, otherwise use all
  const placeTypes = specificPlaceTypes || allPlaceTypes;

  console.log(`  Searching for ${placeTypes.length} place types: ${placeTypes.join(', ')}`);

      // Only clear the categories we're updating
    if (!specificPlaceTypes) {
      // Clear existing place data first and rebuild the structure
      const categoriesToUpdate = ['education', 'geography'];
      for (const category of categoriesToUpdate) {
      if (category === 'education') {
        // Education contains universities and high schools (both handled by French APIs)
        // Preserve existing universities and high schools if they exist
        const existingUniversities = cityData[category]?.universities || [];
        const existingHighSchools = cityData[category]?.highSchools || [];
        cityData[category] = {
          universities: existingUniversities,
          highSchools: existingHighSchools
                };
      } else if (category === 'geography') {
        // Geography contains beaches and ski resorts
        cityData[category] = {
          beaches: [],
          skiResorts: []
        };
      }
    }
  } else {
    // Initialize only the categories we're updating
    for (const placeType of placeTypes) {
      const category = getCategoryForPlaceType(placeType);
      if (category && !cityData[category]) {
        cityData[category] = {};
      }
      if (category) {
        const subcategory = getSubcategoryForPlaceType(placeType);
        if (subcategory && !cityData[category][subcategory]) {
          cityData[category][subcategory] = [];
        }
      }
    }
  }

  // Update each category
  for (const placeType of placeTypes) {
    const category = getCategoryForPlaceType(placeType);
    if (!category) continue;

    // Skip cultural places if they already exist (from French Ministry of Culture API)
    if (category === 'culture') {
      const subcategory = getSubcategoryForPlaceType(placeType);
      if (subcategory && cityData[category][subcategory] && cityData[category][subcategory].length > 0) {
        console.log(`    Skipping ${placeType} - already populated by French Ministry of Culture API`);
        continue;
      }
    }

    console.log(`    Searching for ${placeType}...`);
    const places = await searchPlaces(cityName, placeType);
    console.log(`      Raw results: ${places.length} elements`);

    if (places.length > 0) {
      const placeObjects = [];
      for (const place of places.slice(0, 50)) { // Limit to 50 places per type
        const placeObj = await createPlaceObject(place, placeType, cityName);
        if (placeObj) {
          placeObjects.push(placeObj);
        }
      }

      // Update the specific subcategory
      if (placeObjects.length > 0) {
        const subcategory = getSubcategoryForPlaceType(placeType);
        if (subcategory) {
          cityData[category][subcategory] = placeObjects;
          console.log(`      Updated ${category}.${subcategory} with ${placeObjects.length} places`);
        }
        console.log(`      Found ${placeObjects.length} ${placeType} places`);
      }
    }
  }

  // Write updated data back to file
  fs.writeFileSync(cityFile, JSON.stringify(cityData, null, 2));
  console.log(`  Places data updated for ${cityName}`);
}

/**
 * Get category name for place type
 */
function getCategoryForPlaceType(placeType) {
  const categoryMap = {
    'beach': 'geography',
    'ski resort': 'geography'
  };

  return categoryMap[placeType];
}

/**
 * Get subcategory name for place type
 */
function getSubcategoryForPlaceType(placeType) {
  const subcategoryMap = {
    'beach': 'beaches',
    'ski resort': 'skiResorts'
  };

  return subcategoryMap[placeType];
}

// Helper functions for updating specific place types
async function updateCityHighSchools(cityName) {
  return updateCityPlaces(cityName, ['high school']);
}

async function updateCityBeaches(cityName) {
  return updateCityPlaces(cityName, ['beach']);
}

async function updateCitySkiResorts(cityName) {
  return updateCityPlaces(cityName, ['ski resort']);
}

module.exports = {
  updateCityPlaces,
  updateCityHighSchools,
  updateCityBeaches,
  updateCitySkiResorts
};

// Allow running this script independently
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node osm-places.js <city-name>');
    console.log('Example: node osm-places.js lyon');
    process.exit(1);
  }

  const cityName = args[0];
  console.log(`🗺️  Updating OSM places for ${cityName}...`);

  updateCityPlaces(cityName)
    .then(() => {
      console.log('✅ OSM places update completed!');
    })
    .catch((error) => {
      console.error('❌ Error updating OSM places:', error.message);
      process.exit(1);
    });
}
