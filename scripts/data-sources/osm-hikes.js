/**
 * Hikes Data Source Module
 * Fetches hiking trail data from OpenStreetMap using Nominatim and Overpass APIs
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const DATA_DIR = path.join(__dirname, '../../src/data');
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_BASE_URL = 'https://overpass-api.de/api/interpreter';

// Rate limiting
const NOMINATIM_DELAY = 2000; // 2 seconds between requests
const OVERPASS_DELAY = 2000;  // 2 seconds between requests

// User agent for OpenStreetMap requests
const USER_AGENT = 'CharsykaFrance/1.0 (https://github.com/yourusername/charsyka-france)';

/**
 * Delay function for rate limiting
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Round number to 1 decimal place
 */
function roundToOneDecimal(length) {
  if (length === null || length === undefined || isNaN(length)) {
    return null;
  }
  return Math.round(length * 10) / 10;
}

/**
 * Search for hiking trails in a city using OpenStreetMap
 */
async function searchHikingTrails(cityName) {
  try {
    const trails = await searchOSMHikingTrails(cityName);
    return trails;

  } catch (error) {
    console.error(`Error searching for ${cityName}:`, error.message);
    return [];
  }
}

/**
 * Try to find AllTrails link for a trail
 */
async function findAllTrailsLink(trailName, cityName) {
  try {
    // Construct AllTrails search URL
    const searchQuery = `${trailName} ${cityName}`.replace(/\s+/g, '+');
    const allTrailsSearchUrl = `https://www.alltrails.com/search?search=${searchQuery}`;

    // For now, return the search URL - in a real implementation you'd want to scrape the results
    // But AllTrails has Cloudflare protection, so we'll just provide the search link
    return allTrailsSearchUrl;

  } catch (error) {
    console.error(`        Error finding AllTrails link:`, error.message);
    return null;
  }
}

/**
 * Search OpenStreetMap for hiking trails in a city
 */
async function searchOSMHikingTrails(cityName) {
  try {
    // Rate limiting
    await delay(NOMINATIM_DELAY);

    // First, get the city coordinates to filter results by location
    const cityResponse = await axios.get(`${NOMINATIM_BASE_URL}?q=${encodeURIComponent(cityName)}&format=json&limit=1`, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!cityResponse.data || cityResponse.data.length === 0) {
      throw new Error(`City not found: ${cityName}`);
    }

    const city = cityResponse.data[0];
    const cityLat = parseFloat(city.lat);
    const cityLon = parseFloat(city.lon);
    const searchRadius = 0.3; // Search radius in degrees

    // More specific search queries that should return local results
    const searchQueries = [
      `route=hiking ${cityName}`,
      `network=gr ${cityName}`,
      `network=pr ${cityName}`,
      `ref=GR ${cityName}`,
      `ref=PR ${cityName}`,
      `sentier de randonnée ${cityName}`,
      `chemin de randonnée ${cityName}`,
      `parc naturel ${cityName}`,
      `montagne ${cityName} hiking`,
      `trail ${cityName} hiking`
    ];

    const allTrails = [];

    // Search for each query
    for (const query of searchQueries) {
      await delay(NOMINATIM_DELAY);

      try {
        const response = await axios.get(`${NOMINATIM_BASE_URL}?q=${encodeURIComponent(query)}&format=json&limit=10`, {
          headers: { 'User-Agent': USER_AGENT }
        });

        // Process results
        for (const place of response.data) {
          // Filter by location to ensure trail is actually in the target city area
          if (isLocationNearCity(place, cityLat, cityLon, searchRadius)) {
            if (isHikingTrail(place)) {
              const trail = await createTrailFromOSM(place, cityName);
              if (trail) {
                allTrails.push(trail);
              }
            }
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 403) {
          console.warn(`        Rate limited for query "${query}", skipping...`);
          await delay(5000); // Wait longer if rate limited
        } else {
          console.warn(`        Error searching "${query}": ${error.message}`);
        }
        continue;
      }
    }

    // Remove duplicates based on name and coordinates
    const uniqueTrails = removeDuplicateTrails(allTrails);

    // Filter out trails that are too short to be meaningful hiking trails
    const meaningfulTrails = uniqueTrails.filter(trail => {
      if (!trail.length || trail.length < 0.5) {
        return false;
      }
      return true;
    });

    // Also search for hiking route relations (complete hiking trails)
    const hikingRelations = await searchHikingRouteRelations(cityName, cityLat, cityLon, searchRadius);

    // Combine individual trails with hiking route relations
    const allResults = [...meaningfulTrails, ...hikingRelations];

    return allResults;

  } catch (error) {
    console.error(`Error searching OSM hiking trails:`, error.message);
    return [];
  }
}

/**
 * Search for hiking route relations in a city using Overpass API
 */
async function searchHikingRouteRelations(cityName, cityLat, cityLon, searchRadius) {
  try {
    // Convert radius to degrees (roughly 30km)
    const radiusDegrees = searchRadius;

    // Search for hiking route relations in the area
    const query = `[out:json][timeout:25];
      (
        relation["type"="route"]["route"="hiking"](around:${radiusDegrees * 111000},${cityLat},${cityLon});
        relation["type"="route"]["route"="foot"](around:${radiusDegrees * 111000},${cityLat},${cityLon});
        relation["type"="route"]["network"~"^(gr|pr|hiking)"](around:${radiusDegrees * 111000},${cityLat},${cityLon});
      );
      out body;
      >;
      out skel qt;`;

    const response = await axios.post(OVERPASS_BASE_URL, query, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      },
      timeout: 15000
    });

    const relations = [];
    if (response.data.elements) {
      // Group elements by relation
      const relationMap = new Map();
      const wayMap = new Map();
      const nodeMap = new Map();

      for (const element of response.data.elements) {
        if (element.type === 'relation') {
          relationMap.set(element.id, element);
        } else if (element.type === 'way') {
          wayMap.set(element.id, element);
        } else if (element.type === 'node') {
          nodeMap.set(element.id, element);
        }
      }

      // Process each relation
      for (const [relationId, relation] of relationMap) {
        if (relation.tags && (relation.tags.route === 'hiking' || relation.tags.route === 'foot' ||
            (relation.tags.network && /^(gr|pr|hiking)/.test(relation.tags.network)))) {

          // Calculate total length of the relation
          let totalLength = 0;
          if (relation.members) {
            for (const member of relation.members) {
              if (member.type === 'way' && wayMap.has(member.ref)) {
                const way = wayMap.get(member.ref);
                if (way.nodes && way.nodes.length > 1) {
                  // Calculate way length
                  for (let i = 0; i < way.nodes.length - 1; i++) {
                    const node1 = nodeMap.get(way.nodes[i]);
                    const node2 = nodeMap.get(way.nodes[i + 1]);
                    if (node1 && node2) {
                      const distance = calculateDistance(
                        parseFloat(node1.lat), parseFloat(node1.lon),
                        parseFloat(node2.lat), parseFloat(node2.lon)
                      );
                      totalLength += distance;
                    }
                  }
                }
              }
            }
          }

          const trail = {
            name: relation.tags.name || `Hiking Route ${relationId}`,
            description: `${relation.tags.name || 'Hiking Route'} (${relation.tags.network || 'hiking'})`,
            length: roundToOneDecimal(totalLength), // Raw length
            difficulty: relation.tags.difficulty || relation.tags['difficulty:grade'] || null,
            coordinates: [cityLat, cityLon], // Use city center as approximation
            externalId: relationId,
            externalType: 'relation',
            externalUrl: `https://www.openstreetmap.org/relation/${relationId}`,
            allTrailsUrl: `https://www.alltrails.com/search?search=${encodeURIComponent(relation.tags.name || 'Hiking Route')}+${cityName}`
          };

          relations.push(trail);
        }
      }
    }

    return relations;

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.warn(`        Rate limited by Overpass API for relations, waiting...`);
      await delay(10000); // Wait 10 seconds if rate limited
    } else {
      console.error(`        Error searching hiking route relations:`, error.message);
    }
    return [];
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Check if a location is near the target city
 */
function isLocationNearCity(place, cityLat, cityLon, radius) {
  if (!place.lat || !place.lon) return false;

  const placeLat = parseFloat(place.lat);
  const placeLon = parseFloat(place.lon);

  // Calculate distance using simple Euclidean distance (good enough for filtering)
  const latDiff = Math.abs(placeLat - cityLat);
  const lonDiff = Math.abs(placeLon - cityLon);

  // Convert to approximate km (1 degree ≈ 111 km)
  const distanceKm = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111;

  return distanceKm <= 30; // Within 30km of city center
}

/**
 * Check if an OSM place is a hiking trail
 */
function isHikingTrail(place) {
  // Check for hiking-related tags
  const tags = place.tags || {};
  const displayName = place.display_name.toLowerCase();
  const className = place.class || '';
  const type = place.type || '';

  // Require a proper name - exclude unnamed places
  if (!place.name || place.name.trim() === '' || place.name === 'Unnamed place') {
    return false;
  }

  // Exclude obvious non-hiking places
  if (className === 'shop' || className === 'healthcare' || className === 'amenity') {
    return false;
  }

  // Exclude buildings unless they're specifically marked as parks
  if (className === 'building' && tags.building === 'yes') {
    // Only allow if it's specifically a park building
    if (tags.leisure !== 'park' && tags.leisure !== 'nature_reserve') {
      return false;
    }
  }

  // Exclude businesses and commercial entities
  if (displayName.includes('fromagerie') || displayName.includes('shop') ||
      displayName.includes('store') || displayName.includes('cabinet') ||
      displayName.includes('consultation') || displayName.includes('association')) {
    return false;
  }

  // Exclude healthcare providers
  if (className === 'healthcare' || type === 'speech_therapist' ||
      type === 'doctor' || type === 'dentist' || type === 'pharmacy') {
    return false;
  }

  // Exclude shops and commercial establishments
  if (className === 'shop' || type === 'outdoor' || type === 'clothes' ||
      type === 'sports' || type === 'jewelry') {
    return false;
  }

  // Primary OSM tags that indicate hiking potential (waymarkedtrails.org approach)
  if (tags.route === 'hiking' || tags.route === 'foot') return true;

  // Only accept actual hiking paths, not generic streets
  if (tags.highway === 'path' || tags.highway === 'footway' || tags.highway === 'bridleway') {
    // Must have hiking-specific tags to be considered a trail
    if (tags.hiking || tags.foot || tags.trail_visibility || tags.sac_scale) return true;
    // Or be part of a hiking network
    if (tags.network && (tags.network.includes('gr') || tags.network.includes('pr') || tags.network.includes('hiking'))) return true;
    // Or have a hiking route reference
    if (tags.ref && (tags.ref.includes('GR') || tags.ref.includes('PR') || tags.ref.includes('HRP'))) return true;
  }

  // Parks and nature reserves (but be more selective)
  if (tags.leisure === 'park' || tags.leisure === 'nature_reserve') {
    // Only include if it has trail-related tags or is large enough to be meaningful
    if (tags.natural || tags.tourism === 'viewpoint' || tags.information) return true;
    // For large parks, check if they have trail networks
    if (tags.name && (tags.name.toLowerCase().includes('parc') || tags.name.toLowerCase().includes('park'))) {
      return true;
    }
  }

  // Natural features that are typically hiking destinations
  if (tags.natural === 'peak' || tags.natural === 'mountain' ||
      tags.natural === 'cliff' || tags.natural === 'waterfall') return true;

  // Tourism viewpoints and information points
  if (tags.tourism === 'viewpoint' || tags.tourism === 'information') return true;

  // Text-based detection (more restrictive - waymarkedtrails.org approach)
  const hikingKeywords = [
    'sentier de randonnée', 'chemin de randonnée', 'gr', 'grande randonnée',
    'parc naturel', 'nature reserve', 'montagne hiking', 'trail hiking'
  ];

  // Only accept if the name is clearly a trail/path, not a business or building
  const isClearlyTrail = hikingKeywords.some(keyword => {
    const name = place.name || '';
    return name.toLowerCase().includes(keyword) &&
           !displayName.includes('shop') &&
           !displayName.includes('fromagerie') &&
           !displayName.includes('cabinet') &&
           !displayName.includes('consultation');
  });

  return isClearlyTrail;
}

/**
 * Create trail object from OSM data
 */
async function createTrailFromOSM(place, cityName) {
  try {
    // Extract trail information from Nominatim data
    const name = place.display_name.split(',')[0];

    // Skip trails with generic or unnamed labels
    if (!name || name.trim() === '' ||
        name === 'Unnamed place' ||
        name === 'Unnamed' ||
        name === 'Place' ||
        name === 'Location' ||
        name.toLowerCase().includes('unnamed') ||
        name.toLowerCase().includes('unknown')) {
      return null;
    }

    const coordinates = [parseFloat(place.lat), parseFloat(place.lon)];

    // Get additional details using Overpass API to get real trail length
    const details = await getTrailDetails(place.osm_type, place.osm_id);

    // Try to get length from various OSM tags
    let length = null;
    if (details && details.tags) {
      // Try to get length from various OSM tags
      if (details.tags.length) {
        length = roundToOneDecimal(parseFloat(details.tags.length));
      } else if (details.tags.distance) {
        length = roundToOneDecimal(parseFloat(details.tags.distance));
      } else if (details.tags['distance:km']) {
        length = roundToOneDecimal(parseFloat(details.tags['distance:km']));
      } else if (details.tags['distance:m']) {
        length = roundToOneDecimal(parseFloat(details.tags['distance:m']) / 1000); // Convert meters to km
      } else if (details.tags['distance:mi']) {
        length = roundToOneDecimal(parseFloat(details.tags['distance:mi']) * 1.60934); // Convert miles to km
      } else if (details.tags['distance:ft']) {
        length = roundToOneDecimal(parseFloat(details.tags['distance:ft']) * 0.0003048); // Convert feet to km
      }
    }

    // Try to get difficulty from OSM tags (but don't require it)
    let difficulty = null;
    if (details && details.tags) {
      if (details.tags.difficulty) {
        difficulty = details.tags.difficulty;
      } else if (details.tags['difficulty:grade']) {
        difficulty = details.tags['difficulty:grade'];
      } else if (details.tags['mtb:scale']) {
        // Convert MTB scale to difficulty
        const mtbScale = parseInt(details.tags['mtb:scale']);
        if (mtbScale <= 2) difficulty = 'Easy';
        else if (mtbScale <= 4) difficulty = 'Moderate';
        else difficulty = 'Hard';
      } else if (details.tags['sac_scale']) {
        // Convert SAC scale to difficulty
        const sacScale = details.tags['sac_scale'];
        if (['T1', 'T2'].includes(sacScale)) difficulty = 'Easy';
        else if (['T3', 'T4'].includes(sacScale)) difficulty = 'Moderate';
        else if (['T5', 'T6'].includes(sacScale)) difficulty = 'Hard';
      }
    }

    // Try to find AllTrails link for this trail
    const allTrailsUrl = await findAllTrailsLink(name, cityName);

    const trail = {
      name: name,
      description: place.display_name, // Use the actual OSM description
      length: roundToOneDecimal(length), // Raw length
      difficulty: difficulty,
      coordinates: coordinates,
      externalId: place.osm_id,
      externalType: place.osm_type,
      externalUrl: `https://www.openstreetmap.org/${place.osm_type}/${place.osm_id}`,
      allTrailsUrl: allTrailsUrl
    };

    return trail;

  } catch (error) {
    console.error(`Error creating trail from OSM:`, error.message);
    return null;
  }
}

/**
 * Get detailed trail information using Overpass API
 */
async function getTrailDetails(osmType, osmId) {
  try {
    await delay(OVERPASS_DELAY);

    // Overpass expects: way(12345) or node(12345)
    // For ways, also get the nodes to calculate length
    let query;
    if (osmType === 'way') {
      query = `[out:json][timeout:25];${osmType}(${osmId});out body;>;out skel qt;`;
    } else {
      query = `[out:json][timeout:25];${osmType}(${osmId});out body;`;
    }

    const response = await axios.post(OVERPASS_BASE_URL, query, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      },
      timeout: 10000
    });

    if (response.data.elements && response.data.elements.length > 0) {
      const element = response.data.elements[0];

      // For ways, try to calculate length from coordinates if no length tag exists
      if (osmType === 'way' && element.type === 'way' && !element.tags.length) {
        const calculatedLength = calculateWayLength(element, response.data.elements);
        if (calculatedLength) {
          element.tags = element.tags || {};
          element.tags.length = calculatedLength.toFixed(1);
        }
      }

      return element;
    }

    return null;

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.warn(`        Rate limited by Overpass API, waiting...`);
      await delay(10000); // Wait 10 seconds if rate limited
    } else {
      console.error(`Error getting trail details:`, error.message);
    }
    return null;
  }
}

/**
 * Calculate length of a way based on its nodes
 */
function calculateWayLength(way, nodes) {
  if (!way.nodes || way.nodes.length < 2) {
    return null;
  }

  let totalLength = 0;
  for (let i = 0; i < way.nodes.length - 1; i++) {
    const node1 = nodes.find(n => n.id === way.nodes[i]);
    const node2 = nodes.find(n => n.id === way.nodes[i + 1]);

    if (node1 && node2) {
      const lat1 = parseFloat(node1.lat);
      const lon1 = parseFloat(node1.lon);
      const lat2 = parseFloat(node2.lat);
      const lon2 = parseFloat(node2.lon);

      // Haversine formula to calculate distance between two points
      const R = 6371; // Radius of Earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km
      totalLength += distance;
    }
  }
  // Return with 1 decimal place
  return roundToOneDecimal(totalLength);
}

/**
 * Remove duplicate trails based on name and coordinates
 */
function removeDuplicateTrails(trails) {
  const seen = new Set();
  const unique = [];

  for (const trail of trails) {
    const key = `${trail.name}-${trail.coordinates[0]}-${trail.coordinates[1]}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(trail);
    }
  }

  return unique;
}

/**
 * Create hike object from trail data
 */
function createHikeObject(trail) {
  // Skip trails without proper names
  if (!trail.name || trail.name.trim() === '') {
    return null;
  }

  const name = trail.name.trim();

  // Skip trails with generic or unnamed labels
  const genericNames = [
    'Unnamed place', 'Unnamed', 'Place', 'Location', 'Trail', 'Path', 'Route',
    'Hiking Route', 'Walking Path', 'Footpath', 'Way', 'Track'
  ];

  if (genericNames.includes(name) ||
      name.toLowerCase().includes('unnamed') ||
      name.toLowerCase().includes('unknown') ||
      name.toLowerCase().includes('hiking route') ||
      name.toLowerCase().includes('walking path') ||
      name.toLowerCase().includes('footpath')) {
    return null;
  }

  // Skip trails with very short names (likely generic)
  if (name.length < 3) {
    return null;
  }

  return {
    name: trail.name,
    description: trail.description,
    coordinates: trail.coordinates,
    length: trail.length,
    difficulty: trail.difficulty,
    externalId: trail.externalId,
    externalType: trail.externalType,
    externalUrl: trail.externalUrl,
    source: 'OpenStreetMap'
  };
}

/**
 * Update city hikes data
 */
async function updateCityHikes(cityName) {
  const cityFile = path.join(DATA_DIR, `${cityName}.json`);

  if (!fs.existsSync(cityFile)) {
    throw new Error(`City file not found: ${cityFile}`);
  }

  // Read existing city data
  const cityData = JSON.parse(fs.readFileSync(cityFile, 'utf8'));

  // Search for hiking trails
  const trails = await searchHikingTrails(cityName);

  if (trails.length > 0) {
    console.log(`    Found ${trails.length} raw trails, filtering for named ones...`);

    // Create hike objects and filter out null results
    const hikeObjects = trails.map(trail => createHikeObject(trail)).filter(hike => hike !== null);

    console.log(`    After filtering, ${hikeObjects.length} trails have proper names`);

    // Initialize geography section if it doesn't exist
    if (!cityData.geography) {
      cityData.geography = {};
    }

    // Update hikes array
    cityData.geography.hikes = hikeObjects;

    // Update count and total length metrics

    cityData.geography.hikesTotalLength = roundToOneDecimal(hikeObjects.reduce((total, hike) => total + (hike.length || 0), 0));

  } else {
    // Initialize geography section if it doesn't exist
    if (!cityData.geography) {
      cityData.geography = {};
    }

    // Clear hikes data if none found
    cityData.geography.hikes = [];

    cityData.geography.hikesTotalLength = 0;
  }

  // Write updated data back to file
  fs.writeFileSync(cityFile, JSON.stringify(cityData, null, 2));
}

module.exports = {
  updateCityHikes
};

// Allow running this script independently
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node osm-hikes.js <city-name>');
    console.log('Example: node osm-hikes.js lyon');
    process.exit(1);
  }

  const cityName = args[0];
  console.log(`🥾 Updating hiking trails for ${cityName}...`);

  updateCityHikes(cityName)
    .then(() => {
      console.log('✅ Hiking trails update completed!');
    })
    .catch((error) => {
      console.error('❌ Error updating hiking trails:', error.message);
      process.exit(1);
    });
}