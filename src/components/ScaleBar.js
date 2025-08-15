import React from 'react';
import { formatMetric } from '../utils/metricFormatters';

// Helper function to generate scale bar data
function generateScaleBarNew(cityValues, currentValue, higherBetter) {
  if (cityValues.length === 0) return null;

  // Filter out undefined/null/N/A values, but keep 0 as a valid value
  const validValues = cityValues.filter(v => {
    if (v === undefined || v === null) return false;
    if (v === 'N/A' || v === 'n/a') return false;
    if (typeof v === 'string' && v.trim() === '') return false;
    if (typeof v === 'number' && isNaN(v)) return false;
    // Keep 0 as a valid value (important for metrics like operas, museums, etc.)
    if (v === 0) return true;
    return true;
  });

  if (validValues.length === 0) return null;

  // If current value is N/A or invalid, don't show scale bar
  // But allow 0 as a valid value (important for metrics like operas, museums, etc.)
  if (currentValue === undefined || currentValue === null || currentValue === 'N/A' || currentValue === 'n/a' ||
      (typeof currentValue === 'string' && currentValue.trim() === '') ||
      (typeof currentValue === 'number' && isNaN(currentValue))) {
    return null;
  }

  // Sort values to get ranking-based positions
  const sortedValues = [...validValues].sort((a, b) => a - b);
  const currentRank = sortedValues.findIndex(v => v >= currentValue);

  if (currentRank === -1) {
    return null;
  }

  // Calculate position for current city (0 = leftmost, 1 = rightmost)
  const normalizedPosition = currentRank / (sortedValues.length - 1);

  // For "lower is better" metrics, flip the direction
  const finalPosition = higherBetter ? normalizedPosition : (1 - normalizedPosition);

      // Use the same logic as ComparisonTable.js getScoreColor function
  const min = Math.min(...sortedValues);
  const max = Math.max(...sortedValues);
  const range = max - min;

  // Declare gradientStyle variable
  let gradientStyle;

  // Handle case where all values are identical
  if (range === 0) {
    gradientStyle = {
      background: `linear-gradient(to right,
        #6c757d 0%, #6c757d 100%
      )`
    };
  } else {
    // Use the same thresholds as the table view: 0.8 and 0.2
    // These correspond to 80% and 20% on the normalized scale
    if (higherBetter) {
      // Higher is better: red (poor) on the left, gray (average) in middle, green (excellent) on the right
      // poor: 0-20%, average: 20%-80%, excellent: 80%-100%
      gradientStyle = {
        background: `linear-gradient(to right,
          #dc3545 0%, #dc3545 20%,
          #6c757d 20%, #6c757d 80%,
          #28a745 80%, #28a745 100%
        )`
      };
    } else {
      // Lower is better: green (excellent) on the left, gray (average) in middle, red (poor) on the right
      // excellent: 0-20%, average: 20%-80%, poor: 80%-100%
      gradientStyle = {
        background: `linear-gradient(to right,
          #28a745 0%, #28a745 20%,
          #6c757d 20%, #6c757d 80%,
          #dc3545 80%, #dc3545 100%
        )`
      };
    }
  }

  return {
    gradientStyle,
    finalPosition,
    sortedValues,
    currentValue,
    // Include threshold data for reuse in tooltip calculation
    thresholds: {
      // Use the same fixed thresholds as the table view
      excellentThreshold: 0.8,  // 80% normalized value
      poorThreshold: 0.2,       // 20% normalized value
      min,
      max,
      range
    }
  };
}

/**
 * Redesigned ScaleBar component with new layout: [label]: [value] [scale]
 * @param {Array} cityValues - Array of all city values for this metric
 * @param {*} currentValue - Current city's value for this metric
 * @param {string} metricKey - The metric key (e.g., 'density', 'avgSellPricePerM2')
 * @param {boolean} higherBetter - Whether higher values are better for this metric
 * @param {Function} onMouseEnter - Mouse enter handler for tooltip
 * @param {Function} onMouseLeave - Mouse leave handler for tooltip
 * @returns {JSX.Element|null} The scale bar component or null if no data
 */
const ScaleBar = ({ cityValues, currentValue, metricKey, higherBetter, onMouseEnter, onMouseLeave, cities, onViewList, hasViewList }) => {
  // Parse the metric key to get category and metric name
  const [category, metric] = metricKey.split('.');

  // Use the higherBetter prop that's passed in, not the hardcoded function
  // This ensures consistency with the table view which uses the metrics config
  const isHigherBetterMetric = higherBetter;

  // Generate scale bar data using the new system
  const scaleData = generateScaleBarNew(cityValues, currentValue, isHigherBetterMetric);

  if (!scaleData) return null;

  const { gradientStyle, sortedValues, currentValue: currentVal, thresholds } = scaleData;

    return (
    <div className="new-scale-bar-container" style={{
      width: '100%',
      marginTop: '8px',
      marginBottom: '25px',
      display: 'block',
      maxWidth: '100%',
      overflow: 'visible',
      flex: '1'
    }}>
      <div
        className="new-scale-bar"
        style={{
          ...gradientStyle,
          position: 'relative',
          width: '100%',
          height: '12px',
          borderRadius: '6px',
          border: '1px solid var(--color-border-light, #ccc)',
          overflow: 'visible'
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {sortedValues.map((value, index) => {
          const min = Math.min(...sortedValues);
          const max = Math.max(...sortedValues);
          // Handle case where all values are identical
          const pointPosition = min === max ? 0.5 : (value - min) / (max - min);
          const isCurrentCity = value === currentVal;

          let cityName = 'Unknown';
          if (cities && Array.isArray(cities)) {
            const city = cities.find(c => getCityValue(c, metricKey) === value);
            cityName = city?.name || 'Unknown';
          }

          // Calculate ranking color for current city
          let rankingColor = '#ffffff';
          let textColor = '#000000';
          let borderColor = '#cccccc';

                                                                                if (isCurrentCity) {
            // Use the exact same logic as ComparisonTable.js getScoreColor function
            const { excellentThreshold, poorThreshold, min, max, range } = thresholds;

            if (range === 0) {
              // All values identical - use gray
              rankingColor = '#6c757d';
              textColor = '#ffffff';
              borderColor = '#5a6268';
            } else {
              // Calculate normalized value using the same logic as the table view
              let normalized = (value - min) / (max - min);
              if (!higherBetter) {
                // For "lower is better", flip the normalization like the table view does
                normalized = (max - value) / (max - min);
              }

              // Use the same thresholds as the table view
              if (normalized >= excellentThreshold) {
                // excellent (>= 0.8)
                rankingColor = '#28a745'; // green
                textColor = '#ffffff';
                borderColor = '#1e7e34';
              } else if (normalized >= poorThreshold) {
                // average (>= 0.2)
                rankingColor = '#6c757d'; // gray
                textColor = '#ffffff';
                borderColor = '#5a6268';
              } else {
                // poor (< 0.2)
                rankingColor = '#dc3545'; // red
                textColor = '#ffffff';
                borderColor = '#c82333';
              }
            }
          }

          return (
            <div key={`city-point-${index}`}>
              {/* Only show value label for current city above the scale */}
              {isCurrentCity && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${pointPosition * 100}%`,
                    transform: 'translateX(-50%)',
                    bottom: '20px',
                    zIndex: 4
                  }}
                >
                  {hasViewList ? (
                    <button
                      onClick={() => onViewList && onViewList(metricKey)}
                      title="Click to view details"
                      style={{
                        background: rankingColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                        e.target.style.borderColor = '#ffffff';
                        e.target.style.background = '#4a90e2';
                        // Animate the icon
                        const icon = e.target.querySelector('svg');
                        if (icon) icon.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        e.target.style.borderColor = borderColor;
                        e.target.style.background = rankingColor;
                        // Reset the icon
                        const icon = e.target.querySelector('svg');
                        if (icon) icon.style.transform = 'scale(1)';
                      }}
                    >
                      <span style={{
                        fontSize: '0.9rem',
                        color: textColor,
                        fontWeight: '700',
                        whiteSpace: 'nowrap'
                      }}>
                        {formatMetric(category, metric, value)}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  ) : (
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: textColor,
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        background: rankingColor,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        border: `1px solid ${borderColor}`
                      }}
                    >
                      {formatMetric(category, metric, value)}
                    </div>
                  )}
                </div>
              )}

              <div
                className={`city-point ${isCurrentCity ? 'current-city' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${pointPosition * 100}%`,
                  transform: pointPosition === 0 ? 'translateX(0%)' :
                           pointPosition === 1 ? 'translateX(-100%)' :
                           'translateX(-50%)',
                  zIndex: 1
                }}
                title={`${cityName}: ${formatMetric(category, metric, value)}`}
              />
            </div>
          );
        })}

        {/* Min and Max values below the scale */}
        {/* For "higher is better" metrics: min (red) on left, max (green) on right */}
        {/* For "lower is better" metrics: min (green) on left, max (red) on right */}
        <div style={{
          position: 'absolute',
          left: '0',
          top: '15px',
          fontSize: '0.7rem',
          color: '#666',
          fontWeight: '500'
        }}>
          {formatMetric(category, metric, Math.min(...sortedValues))}
        </div>
        <div style={{
          position: 'absolute',
          right: '0',
          top: '15px',
          fontSize: '0.7rem',
          color: '#666',
          fontWeight: '500'
        }}>
          {formatMetric(category, metric, Math.max(...sortedValues))}
        </div>
        </div>
      </div>
  );
};

// Helper function to get city value (same as in CityDetailPage)
function getCityValue(city, metricKey) {
  const [category, metric] = metricKey.split('.');
  if (category === 'weather') {
    return city.weather?.[metric];
  } else if (category === 'population') {
    return city.population?.[metric];
  } else if (category === 'education') {
    if (metric === 'highSchools') return city.highSchools;
    if (metric === 'universities') return city.universities;
    if (metric === 'internationalHighSchools') return city.internationalHighSchools;
    return city.education?.[metric];
  } else if (category === 'culture') {
    if (metric === 'museums') return city.museums;
    if (metric === 'theaters') return city.theaters;
    if (metric === 'cinemas') return city.cinemas;
    if (metric === 'operas') return city.operas;
    return city.culture?.[metric];
  } else if (category === 'transportation') {
    return city.transportation?.[metric];
  } else if (category === 'geography') {
    if (metric === 'hikes') return city.hikes;
    if (metric === 'hikesTotalLength') return city.hikesTotalLength;
    return city.geography?.[metric];
  } else if (category === 'housing') {
    return city.housing?.[metric];
  } else if (category === 'qualityOfLife') {
    return city.qualityOfLife?.[metric];
  }
  return city[category]?.[metric];
}

export default ScaleBar;
