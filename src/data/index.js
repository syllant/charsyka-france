/**
 * City Data Index
 *
 * This file exports all city data and provides utility functions
 * for accessing and validating city information.
 */

// Import all city data and schema
import aixEnProvence from './aix-en-provence.json';
import bordeaux from './bordeaux.json';
import marseille from './marseille.json';
import montpellier from './montpellier.json';
import nantes from './nantes.json';
import lyon from './lyon.json';
import oakland from './oakland.json';
import schema from './schema.json';

// Export city data and schema
export { aixEnProvence, bordeaux, marseille, montpellier, nantes, lyon, oakland, schema };

// Import validation functions
export { validateCityData, validateCities, getValidationSummary } from './validator';

// Main cities (French cities for comparison)
export const mainCities = [
  'aix-en-provence',
  'bordeaux',
  'marseille',
  'montpellier',
  'nantes'
];

// Reference cities (for context)
export const referenceCities = [
  'lyon',
  'oakland'
];

// All cities
export const allCities = [...mainCities, ...referenceCities];

// City data mapping
export const cityDataMap = {
  'aix-en-provence': () => Promise.resolve(aixEnProvence),
  'bordeaux': () => Promise.resolve(bordeaux),
  'marseille': () => Promise.resolve(marseille),
  'montpellier': () => Promise.resolve(montpellier),
  'nantes': () => Promise.resolve(nantes),
  'lyon': () => Promise.resolve(lyon),
  'oakland': () => Promise.resolve(oakland)
};

// Utility functions
export const getCityById = async (id) => {
  const cityGetter = cityDataMap[id];
  if (!cityGetter) {
    throw new Error(`City with id '${id}' not found`);
  }
  return await cityGetter();
};

export const getAllCities = async () => {
  const cities = await Promise.all(
    allCities.map(async (id) => await getCityById(id))
  );
  return cities;
};

export const getMainCities = async () => {
  const cities = await Promise.all(
    mainCities.map(async (id) => await getCityById(id))
  );
  return cities;
};

export const getReferenceCities = async () => {
  const cities = await Promise.all(
    referenceCities.map(async (id) => await getCityById(id))
  );
  return cities;
};

// Data quality information
export const getDataQualityInfo = () => ({
  totalCities: allCities.length,
  mainCities: mainCities.length,
  referenceCities: referenceCities.length,
  lastUpdated: '2023-12-01',
  dataSources: 8,
  schemaVersion: '1.0.0'
});

// Export default for backward compatibility
const cityDataModule = {
  mainCities,
  referenceCities,
  allCities,
  getCityById,
  getAllCities,
  getMainCities,
  getReferenceCities,
  getDataQualityInfo
};

export default cityDataModule;
