/**
 * OpenStreetMap Nominatim Geocoding Utility
 * Provides free geocoding services for converting addresses to coordinates
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Geocode an address using OpenStreetMap Nominatim
 * @param {string} address - The address to geocode
 * @param {string} country - Optional country code (e.g., 'France')
 * @returns {Promise<Array|null>} - [latitude, longitude] or null if not found
 */
export const geocodeAddress = async (address, country = 'France') => {
  try {
    // Construct the search query
    const searchQuery = country ? `${address}, ${country}` : address;

    // Build the API URL with proper parameters
    const url = new URL(NOMINATIM_BASE_URL);
    url.searchParams.set('q', searchQuery);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', 'en');

    // Add user agent header (required by Nominatim)
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'CharsykaFrance/1.0 (https://charsyka-france.com)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return [parseFloat(result.lat), parseFloat(result.lon)];
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * Batch geocode multiple addresses
 * @param {Array} addresses - Array of address strings
 * @param {string} country - Optional country code
 * @returns {Promise<Array>} - Array of [address, coordinates] pairs
 */
export const batchGeocode = async (addresses, country = 'France') => {
  const results = [];

  for (const address of addresses) {
    try {
      // Add delay to respect Nominatim's rate limiting (1 request per second)
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const coordinates = await geocodeAddress(address, country);
      results.push({
        address,
        coordinates,
        success: coordinates !== null
      });

      console.log(`Geocoded: ${address} -> ${coordinates ? coordinates.join(', ') : 'Not found'}`);
    } catch (error) {
      console.error(`Failed to geocode ${address}:`, error);
      results.push({
        address,
        coordinates: null,
        success: false,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Validate coordinates
 * @param {Array} coordinates - [latitude, longitude]
 * @returns {boolean} - True if coordinates are valid
 */
export const validateCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }

  const [lat, lon] = coordinates;
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  );
};

/**
 * Calculate distance between two coordinates in kilometers
 * @param {Array} coords1 - [lat1, lon1]
 * @param {Array} coords2 - [lat2, lon2]
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (coords1, coords2) => {
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
