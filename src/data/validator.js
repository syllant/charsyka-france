/**
 * City Data Validator
 *
 * This file provides validation utilities using the JSON Schema
 * for validating city data against the defined schema.
 */

import schema from './schema.json';

// Simple JSON Schema validator (for basic validation)
// In production, you might want to use a full JSON Schema library like ajv
export const validateCityData = (cityData) => {
  const errors = [];

  try {
    // Basic type checking
    if (typeof cityData !== 'object' || cityData === null) {
      errors.push('City data must be an object');
      return errors;
    }

    // Check required fields
    const requiredFields = schema.required || [];
    requiredFields.forEach(field => {
      if (!(field in cityData)) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Check ID format
    if (cityData.id && !/^[a-z0-9-]+$/.test(cityData.id)) {
      errors.push('ID must contain only lowercase letters, numbers, and hyphens');
    }

    // Check coordinates
    if (cityData.coordinates) {
      if (!Array.isArray(cityData.coordinates) || cityData.coordinates.length !== 2) {
        errors.push('Coordinates must be an array with exactly 2 numbers [latitude, longitude]');
      } else if (typeof cityData.coordinates[0] !== 'number' || typeof cityData.coordinates[1] !== 'number') {
        errors.push('Coordinates must contain numbers');
      }
    }

    // Check weather data
    if (cityData.weather) {
      const weather = cityData.weather;

      if (typeof weather.sunnyDays !== 'number' || weather.sunnyDays < 0 || weather.sunnyDays > 365) {
        errors.push('sunnyDays must be a number between 0 and 365');
      }

      if (typeof weather.rainyDays !== 'number' || weather.rainyDays < 0 || weather.rainyDays > 365) {
        errors.push('rainyDays must be a number between 0 and 365');
      }

      if (typeof weather.avgTemp !== 'number' || weather.avgTemp < -50 || weather.avgTemp > 50) {
        errors.push('avgTemp must be a number between -50 and 50');
      }

      if (weather.monthlyData) {
        if (!Array.isArray(weather.monthlyData) || weather.monthlyData.length !== 12) {
          errors.push('monthlyData must be an array with exactly 12 numbers');
        } else if (!weather.monthlyData.every(temp => typeof temp === 'number')) {
          errors.push('monthlyData must contain only numbers');
        }
      }
    }

    // Check population data
    if (cityData.population) {
      const pop = cityData.population;

      if (typeof pop.total !== 'number' || pop.total < 0) {
        errors.push('population.total must be a non-negative number');
      }

      if (typeof pop.studentPercentage !== 'number' || pop.studentPercentage < 0 || pop.studentPercentage > 100) {
        errors.push('population.studentPercentage must be a number between 0 and 100');
      }

      if (typeof pop.density !== 'number' || pop.density < 0) {
        errors.push('population.density must be a non-negative number');
      }
    }

    // Check transportation data
    if (cityData.transportation) {
      const trans = cityData.transportation;

      if (typeof trans.internationalFlights !== 'number' || trans.internationalFlights < 0) {
        errors.push('transportation.internationalFlights must be a non-negative number');
      }

      if (typeof trans.transitScore !== 'number' || trans.transitScore < 1 || trans.transitScore > 10) {
        errors.push('transportation.transitScore must be a number between 1 and 10');
      }

      // Check distance objects
      ['distanceToParis', 'distanceToLyon'].forEach(distanceKey => {
        if (trans[distanceKey]) {
          const distance = trans[distanceKey];
          if (typeof distance !== 'object' || distance === null) {
            errors.push(`${distanceKey} must be an object`);
          } else {
            if (typeof distance.car !== 'number' || distance.car < 0) {
              errors.push(`${distanceKey}.car must be a non-negative number`);
            }
            if (typeof distance.train !== 'number' || distance.train < 0) {
              errors.push(`${distanceKey}.train must be a non-negative number`);
            }
          }
        }
      });
    }

    // Check quality of life scores
    if (cityData.qualityOfLife) {
      const qol = cityData.qualityOfLife;
      const scoreFields = ['greenSpaces', 'airQuality', 'liveabilityScore', 'healthQuality'];

      scoreFields.forEach(field => {
        if (qol[field] !== undefined) {
          if (typeof qol[field] !== 'number' || qol[field] < 1 || qol[field] > 10) {
            errors.push(`qualityOfLife.${field} must be a number between 1 and 10`);
          }
        }
      });

      if (qol.costOfLife !== undefined) {
        if (typeof qol.costOfLife !== 'number' || qol.costOfLife < 1 || qol.costOfLife > 10) {
          errors.push('qualityOfLife.costOfLife must be a number between 1 and 10');
        }
      }
    }

    // Check images array
    if (cityData.images) {
      if (!Array.isArray(cityData.images) || cityData.images.length < 3 || cityData.images.length > 5) {
        errors.push('images must be an array with 3 to 5 items');
      } else if (!cityData.images.every(img => typeof img === 'string' && img.startsWith('http'))) {
        errors.push('images must contain valid URLs');
      }
    }

  } catch (error) {
    errors.push(`Validation error: ${error.message}`);
  }

  return errors;
};

// Validate multiple cities
export const validateCities = (cities) => {
  const results = [];

  cities.forEach((city, index) => {
    const errors = validateCityData(city);
    if (errors.length > 0) {
      results.push({
        cityId: city.id || `city_${index}`,
        cityName: city.name || 'Unknown',
        errors,
        isValid: false
      });
    } else {
      results.push({
        cityId: city.id,
        cityName: city.name,
        errors: [],
        isValid: true
      });
    }
  });

  return results;
};

// Get validation summary
export const getValidationSummary = (validationResults) => {
  const total = validationResults.length;
  const valid = validationResults.filter(r => r.isValid).length;
  const invalid = total - valid;
  const totalErrors = validationResults.reduce((sum, r) => sum + r.errors.length, 0);

  return {
    total,
    valid,
    invalid,
    totalErrors,
    successRate: total > 0 ? (valid / total) * 100 : 0
  };
};

// Export schema for external use
export { schema };
