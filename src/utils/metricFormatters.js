// Standardized metric formatting utilities based on schema definitions

// Metric formatting rules from schema
const METRIC_FORMATTERS = {
  population: {
    total: { unit: '', format: 'compact', precision: 0 },
    studentPercentage: { unit: '%', format: 'integer', precision: 0 },
    density: { unit: '/km²', format: 'integer', precision: 0 }
  },
  weather: {
    sunnyDays: { unit: '', format: 'integer', precision: 0 },
    rainyDays: { unit: '', format: 'integer', precision: 0 },
    avgTemp: { unit: '°C', format: 'decimal', precision: 1 },
    precipitation: { unit: 'mm', format: 'decimal', precision: 1 }
  },
  transportation: {
    transitScore: { unit: '', format: 'decimal', precision: 1 },
    distanceToParis: { unit: 'hours', format: 'decimal', precision: 1 },
    distanceToLyon: { unit: 'hours', format: 'decimal', precision: 1 },
    distanceToParisWithCar: { unit: 'h', format: 'decimal', precision: 1 },
    distanceToParisWithTrain: { unit: 'h', format: 'decimal', precision: 1 },
    distanceToLyonWithCar: { unit: 'h', format: 'decimal', precision: 1 },
    distanceToLyonWithTrain: { unit: 'h', format: 'decimal', precision: 1 },
    internationalFlights: { unit: '', format: 'integer', precision: 0 }
  },
  education: {
    highSchools: { unit: '', format: 'integer', precision: 0 },
    universities: { unit: '', format: 'integer', precision: 0 },
    internationalHighSchools: { unit: '', format: 'integer', precision: 0 }
  },
  culture: {
    museums: { unit: '', format: 'integer', precision: 0 },
    cinemas: { unit: '', format: 'integer', precision: 0 },
    theaters: { unit: '', format: 'integer', precision: 0 },
    operas: { unit: '', format: 'integer', precision: 0 },
    culturalEvents: { unit: '', format: 'integer', precision: 0 }
  },
  geography: {

    hikesTotalLength: { unit: 'km', format: 'decimal', precision: 1 },
    hikeLength: { unit: 'km', format: 'decimal', precision: 1 }
  },
  housing: {
    avgSellPricePerM2: { unit: '€/m²', format: 'integer', precision: 0 },
    avgRentPricePerM2: { unit: '€/m²', format: 'integer', precision: 0 }
  },
  qualityOfLife: {
    crimeRate: { unit: '', format: 'decimal', precision: 1 },
    greenSpaces: { unit: '', format: 'decimal', precision: 1 },
    airQuality: { unit: '', format: 'decimal', precision: 1 },
    costOfLife: { unit: '', format: 'decimal', precision: 1 },
    liveabilityScore: { unit: '', format: 'decimal', precision: 1 },
    healthQuality: { unit: '', format: 'decimal', precision: 1 }
  }
};



/**
 * Format a metric value according to its schema definition
 * @param {string} category - The metric category (e.g., 'population', 'weather')
 * @param {string} metric - The specific metric name (e.g., 'total', 'sunnyDays')
 * @param {number} value - The value to format
 * @returns {string} Formatted value with unit
 */
export function formatMetric(category, metric, value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  // Special handling for hikesTotalLength - no decimals if over 10km
  if (category === 'geography' && metric === 'hikesTotalLength') {
    return value >= 10 ? Math.round(value).toLocaleString() + 'km' : value.toFixed(1) + 'km';
  }

  // Special handling for individual hike lengths - no decimals if over 10km
  if (category === 'geography' && metric === 'hikeLength') {
    return value >= 10 ? Math.round(value).toLocaleString() + 'km' : value.toFixed(1) + 'km';
  }

  const formatter = METRIC_FORMATTERS[category]?.[metric];
  if (!formatter) {
    return value.toString();
  }

  let formattedValue;
  if (formatter.format === 'integer') {
    formattedValue = Math.round(value).toLocaleString();
  } else if (formatter.format === 'decimal') {
    formattedValue = value.toFixed(formatter.precision);
  } else if (formatter.format === 'compact') {
    // Format population in compact form (e.g., 123K, 1.2M)
    if (value >= 1000000) {
      formattedValue = (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      formattedValue = (value / 1000).toFixed(0) + 'K';
    } else {
      formattedValue = value.toString();
    }
  } else {
    formattedValue = value.toString();
  }

  // Only add unit if it exists
  return formatter.unit ? `${formattedValue}${formatter.unit}` : formattedValue;
}

/**
 * Format a metric value without the unit (just the formatted number)
 * @param {string} category - The metric category
 * @param {string} metric - The specific metric name
 * @param {number} value - The value to format
 * @returns {string} Formatted value without unit
 */
export function formatMetricValue(category, metric, value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  const formatter = METRIC_FORMATTERS[category]?.[metric];
  if (!formatter) {
    return value.toString();
  }

  if (formatter.format === 'integer') {
    return Math.round(value).toLocaleString();
  } else if (formatter.format === 'decimal') {
    return value.toFixed(formatter.precision);
  }

  return value.toString();
}

/**
 * Get the unit for a specific metric
 * @param {string} category - The metric category
 * @param {string} metric - The specific metric name
 * @returns {string} The unit string
 */
export function getMetricUnit(category, metric) {
  return METRIC_FORMATTERS[category]?.[metric]?.unit || '';
}

/**
 * Check if a metric is "higher better" for scoring purposes
 * @param {string} category - The metric category
 * @param {string} metric - The specific metric name
 * @returns {boolean} True if higher values are better
 */
export function isHigherBetter(category, metric) {
  // Metrics that are better when lower
  const lowerBetterMetrics = [
    'density',                    // Population density (lower = less crowded)

    'avgSellPricePerM2',         // House prices (lower = more affordable)
    'avgRentPricePerM2',         // Rent prices (lower = more affordable)
    'crimeRate',                 // Crime rate (lower = safer)
    'distanceToParis',           // Time to Paris (lower = faster)
    'distanceToLyon',            // Time to Lyon (lower = faster)
    'distanceToParisWithCar',    // Time to Paris by car (lower = faster)
    'distanceToParisWithTrain',  // Time to Paris by train (lower = faster)
    'distanceToLyonWithCar',     // Time to Lyon by car (lower = faster)
    'distanceToLyonWithTrain',   // Time to Lyon by train (lower = faster)
    'rainyDays',                 // Rainy days (lower = better weather)
    'precipitation'              // Precipitation (lower = better weather)
  ];

  return !lowerBetterMetrics.includes(metric);
}

/**
 * Format travel time in hours to a readable format
 * @param {number} hours - Time in hours
 * @returns {string} Formatted time (e.g., "2h30", "1h")
 */
export function formatTravelTime(hours) {
  if (typeof hours !== 'number' || hours < 0) return 'N/A';

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours}h`;
  } else {
    return `${wholeHours}h${minutes.toString().padStart(2, '0')}`;
  }
}

/**
 * Format array metrics (like counts of places)
 * @param {Array} array - The array to count
 * @returns {string} Formatted count
 */
export function formatArrayMetric(array) {
  if (!Array.isArray(array)) return 'N/A';
  return array.length.toString();
}

/**
 * Get all available metric categories
 * @returns {Array} Array of metric category names
 */
export function getMetricCategories() {
  return Object.keys(METRIC_FORMATTERS);
}

/**
 * Get all available metrics for a category
 * @param {string} category - The metric category
 * @returns {Array} Array of metric names
 */
export function getMetricsForCategory(category) {
  return Object.keys(METRIC_FORMATTERS[category] || {});
}


