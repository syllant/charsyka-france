#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://data.culture.gouv.fr/api/explore/v2.1/catalog/datasets/base-des-lieux-et-des-equipements-culturels/records';

// Cultural place types mapping
const CULTURAL_PLACE_TYPES = {
  museums: 'Musée',
  cinemas: 'Cinéma',
  theaters: 'Théâtre',
  operas: 'Opéra'
};

// City coordinates for geo filtering (10km radius)
const CITY_COORDINATES = {
  'lyon': { lat: 45.7578, lon: 4.8320 },
  'marseille': { lat: 43.2965, lon: 5.3698 },
  'bordeaux': { lat: 44.8378, lon: -0.5792 },
  'nantes': { lat: 47.2184, lon: -1.5536 },
  'montpellier': { lat: 43.6108, lon: 3.8767 },
  'aix-en-provence': { lat: 43.5297, lon: 5.4474 },
  'oakland': { lat: 37.8044, lon: -122.2711 }
};



/**
 * Search for cultural places by type and city
 */
async function searchCulturalPlaces(cityName, placeType) {
  try {
    const cityCoords = CITY_COORDINATES[cityName.toLowerCase()];
    if (!cityCoords) {
      console.warn(`No coordinates found for city: ${cityName}`);
      return [];
    }

    const placeTypeValue = CULTURAL_PLACE_TYPES[placeType];
    if (!placeTypeValue) {
      console.warn(`Unknown place type: ${placeType}`);
      return [];
    }

        // Use proper geo filtering with within_distance function
    const queryParams = new URLSearchParams();
    queryParams.append('refine', `type_equipement_ou_lieu:${placeTypeValue}`);
    queryParams.append('where', `within_distance(coordonnees_geo, geom'POINT(${cityCoords.lon} ${cityCoords.lat})', 5km)`);
    queryParams.append('limit', '100');

    console.log(`Searching for ${placeType} in ${cityName} with query:`, queryParams.toString());

    const response = await axios.get(`${BASE_URL}?${queryParams.toString()}`);

    if (response.data && response.data.results) {
      console.log(`Found ${response.data.results.length} ${placeType} within 5km of ${cityName}`);
      return response.data.results;
    }

    return [];
  } catch (error) {
    console.error(`Error searching for ${placeType} in ${cityName}:`, error.message);
    return [];
  }
}

/**
 * Create a cultural place object from API response
 */
function createCulturalPlaceObject(place, placeType) {
  const coordinates = place.coordonnees_geo ? [place.coordonnees_geo.lat, place.coordonnees_geo.lon] : null;

  let address = '';
  if (place.adresse) address += place.adresse;
  if (place.code_postal) address += `, ${place.code_postal}`;
  if (place.libelle_geographique) address += ` ${place.libelle_geographique}`;

  return {
    name: place.nom || 'Unnamed Cultural Place',
    address: address.trim(),
    coordinates: coordinates,
    website: null, // API doesn't provide website URLs
    externalId: place.identifiant_origine || place.identifiant_deps_a_partir_de_2022 || place.id,
    externalType: 'fr-culture',
    externalUrl: `https://data.culture.gouv.fr/explore/dataset/base-des-lieux-et-des-equipements-culturels/table/?q=${encodeURIComponent(place.nom || '')}`,
    osmId: `fr-culture:${place.identifiant_origine || place.identifiant_deps_a_partir_de_2022 || place.id}`,
    osmType: 'fr-culture',
    lastUpdated: new Date().toISOString(),
    type: place.type_equipement_ou_lieu || placeType,
    dataSource: 'French Ministry of Culture',
    // Additional cultural-specific fields
    region: place.region,
    departement: place.departement,
    label: place.label_et_appellation,
    // Cinema-specific fields
    ...(placeType === 'cinemas' && {
      screens: place.nombre_ecrans,
      seats: place.nombre_fauteuils_de_cinema,
      multiplex: place.multiplexe === 'OUI',
      cinemaType: place.type_de_cinema
    }),
    // Theater-specific fields
    ...(placeType === 'theaters' && {
      theaterSeats: place.jauge_du_theatre,
      theaterOrganism: place.organisme_siege_du_theatre
    })
  };
}

/**
 * Update city with cultural places data
 */
async function updateCityCulturalPlaces(cityData, cityName, specificPlaceTypes = null) {
  console.log(`\nUpdating cultural places for ${cityName}...`);

  if (!cityData.culture) {
    cityData.culture = {};
  }

  const placeTypesToUpdate = specificPlaceTypes || Object.keys(CULTURAL_PLACE_TYPES);

  for (const placeType of placeTypesToUpdate) {
    console.log(`\nFetching ${placeType} for ${cityName}...`);

    const places = await searchCulturalPlaces(cityName, placeType);
    const placeObjects = places.map(place => createCulturalPlaceObject(place, placeType));

    // Update the specific place type
    cityData.culture[placeType] = placeObjects;



    console.log(`Updated ${placeType}: ${placeObjects.length} places`);

    // Add delay between API calls to be respectful
    if (placeTypesToUpdate.indexOf(placeType) < placeTypesToUpdate.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\nCultural places update completed for ${cityName}`);
}

module.exports = {
  searchCulturalPlaces,
  createCulturalPlaceObject,
  updateCityCulturalPlaces,
  CULTURAL_PLACE_TYPES
};
