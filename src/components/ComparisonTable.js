import React, { Fragment, useState } from 'react';
import { useCities } from '../context/CityContext';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatMetric, formatArrayMetric, isHigherBetter } from '../utils/metricFormatters';
import { METRIC_CONFIG } from '../config/metrics';

const ComparisonTable = () => {
  const { cities, loading } = useCities();
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [tooltip, setTooltip] = useState({ show: false, content: null, position: { x: 0, y: 0 }, hovering: false });
  const tableRef = React.useRef(null);

  // Handle scroll to make header sticky
  React.useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current) {
        const rect = tableRef.current.getBoundingClientRect();
        const isSticky = rect.top <= 0;
        setIsHeaderSticky(isSticky);

        // If sticky, ensure header columns align with body columns
        if (isSticky && tableRef.current) {
          // Small delay to ensure sticky header is fully rendered
          setTimeout(() => {
            const stickyHeader = document.querySelector('.sticky-header-clone');
            if (stickyHeader) {
              // Position the sticky header exactly over the main table
              const tableRect = tableRef.current.getBoundingClientRect();

              stickyHeader.style.position = 'fixed';
              stickyHeader.style.top = '0px';
              stickyHeader.style.left = tableRect.left + 'px';
              stickyHeader.style.width = tableRect.width + 'px';
              stickyHeader.style.paddingLeft = '0px';
              stickyHeader.style.paddingRight = '0px';

              // Force the sticky header table to have the same layout as the main table
              const stickyTable = stickyHeader.querySelector('table');
              const mainTable = tableRef.current;

              // Copy the exact computed styles from the main table
              const mainTableStyle = window.getComputedStyle(mainTable);
              stickyTable.style.width = '100%';
              stickyTable.style.margin = '0';
              stickyTable.style.tableLayout = mainTableStyle.tableLayout;
              stickyTable.style.borderCollapse = mainTableStyle.borderCollapse;
              stickyTable.style.borderSpacing = mainTableStyle.borderSpacing;

              // Copy the exact computed styles from each header cell
              const mainHeaderCells = mainTable.querySelectorAll('thead th');
              const stickyHeaderCells = stickyHeader.querySelectorAll('th');

              mainHeaderCells.forEach((mainCell, index) => {
                if (stickyHeaderCells[index]) {
                  const mainCellStyle = window.getComputedStyle(mainCell);
                  const stickyCell = stickyHeaderCells[index];

                  stickyCell.style.width = mainCellStyle.width;
                  stickyCell.style.minWidth = mainCellStyle.minWidth;
                  stickyCell.style.maxWidth = mainCellStyle.maxWidth;
                  stickyCell.style.padding = mainCellStyle.padding;
                  stickyCell.style.border = mainCellStyle.border;
                  stickyCell.style.boxSizing = mainCellStyle.boxSizing;
                }
              });
            }
          }, 10);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debug logging


  // Add loading state check
  if (loading) {
    return (
      <div className="comparison-table-container">
        <div className="loading-message">
          <p>Loading city data...</p>
        </div>
      </div>
    );
  }

  // Add null check and default to empty array
  if (!cities || cities.length === 0) {
    return (
      <div className="comparison-table-container">
        <div className="loading-message">
          <p>No city data available.</p>
        </div>
      </div>
    );
  }

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const showTooltip = (event, dimension) => {
    const rect = event.target.getBoundingClientRect();
    setTooltip({
      show: true,
      content: dimension,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 10
      }
    });
  };

  const hideTooltip = () => {
    // Add a small delay to allow moving cursor to tooltip
    setTimeout(() => {
      setTooltip(prev => {
        // Only hide if we're not hovering over the tooltip itself
        if (!prev.hovering) {
          return { show: false, content: null, position: { x: 0, y: 0 }, hovering: false };
        }
        return prev;
      });
    }, 100);
  };

  const handleTooltipMouseEnter = () => {
    setTooltip(prev => ({ ...prev, hovering: true }));
  };

  const handleTooltipMouseLeave = () => {
    setTooltip(prev => ({ ...prev, hovering: false }));
    // Hide immediately when leaving the tooltip
    setTimeout(() => {
      setTooltip(prev => {
        if (!prev.hovering) {
          return { show: false, content: null, position: { x: 0, y: 0 }, hovering: false };
        }
        return prev;
      });
    }, 100);
  };

    const getDataSourceName = (url) => {
    if (url.includes('data.culture.gouv.fr')) {
      return 'French Ministry of Culture';
    }
    if (url.includes('data.education.gouv.fr')) {
      return 'French Ministry of Education';
    }
    if (url.includes('data.enseignementsup-recherche.gouv.fr')) {
      return 'French Ministry of Higher Education';
    }
    if (url.includes('insee.fr')) {
      return 'French National Institute of Statistics';
    }
    if (url.includes('openstreetmap.org')) {
      return 'OpenStreetMap';
    }
    if (url.includes('overpass-api.de')) {
      return 'OpenStreetMap Overpass API';
    }
    if (url.includes('open-meteo.com')) {
      return 'Open-Meteo Historical API';
    }

    // Extract domain name as fallback
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'External Source';
    }
  };



  const getScoreColor = (value, dimensionKey, cities, higherBetter) => {
    // Handle travel time metrics that have distinct keys
    let values;
    if (dimensionKey === 'transportation.distanceToParisWithCar') {
      values = cities.map(city => city.transportation?.distanceToParisWithCar).filter(v => v !== undefined && v !== null && v !== 'N/A' && v !== 'n/a' && v !== 0 &&
                   (typeof v !== 'string' || v.trim() !== '') &&
                   (typeof v !== 'number' || !isNaN(v)));
    } else if (dimensionKey === 'transportation.distanceToParisWithTrain') {
      values = cities.map(city => city.transportation?.distanceToParisWithTrain).filter(v => v !== undefined && v !== null && v !== 'N/A' && v !== 'n/a' && v !== 0 &&
                   (typeof v !== 'string' || v.trim() !== '') &&
                   (typeof v !== 'number' || !isNaN(v)));
    } else if (dimensionKey === 'transportation.distanceToLyonWithCar') {
      values = cities.map(city => city.transportation?.distanceToLyonWithCar).filter(v => v !== undefined && v !== null && v !== 'N/A' && v !== 'n/a' && v !== 0 &&
                   (typeof v !== 'string' || v.trim() !== '') &&
                   (typeof v !== 'number' || !isNaN(v)));
    } else if (dimensionKey === 'transportation.distanceToLyonWithTrain') {
      values = cities.map(city => city.transportation?.distanceToLyonWithTrain).filter(v => v !== undefined && v !== null && v !== 'N/A' && v !== 'n/a' && v !== 0 &&
                   (typeof v !== 'string' || v.trim() !== '') &&
                   (typeof v !== 'number' || !isNaN(v)));
    } else if (dimensionKey.includes('geography.hikesTotalLength')) {
      // For hiking trails total length
      values = cities.map(city => city.geography?.hikesTotalLength || 0).filter(v => v !== undefined && v !== null && v !== 'N/A' && v !== 'n/a' &&
                                                                               (typeof v !== 'string' || v.trim() !== '') &&
                                                                               (typeof v !== 'number' || !isNaN(v)));
    } else {
      // For regular metrics
      values = cities.map(city => {
        if (dimensionKey.includes('.')) {
          const [category, metric] = dimensionKey.split('.');
          const metricValue = city[category]?.[metric];
          // Handle array metrics by returning their length
          if (Array.isArray(metricValue)) {
            return metricValue.length;
          }
          return metricValue;
        }
        const metricValue = city[dimensionKey];
        // Handle array metrics by returning their length
        if (Array.isArray(metricValue)) {
          return metricValue.length;
        }
        return metricValue;
      }).filter(v => v !== undefined && v !== null && v !== 'N/A' && v !== 'n/a' &&
                     (typeof v !== 'string' || v.trim() !== '') &&
                     (typeof v !== 'number' || !isNaN(v)));
    }

    // Filter out non-numeric values and ensure we have valid data
    const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));



    if (numericValues.length === 0) return 'neutral';

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    if (max === min) return 'neutral';

    // Ensure the input value is also numeric and not N/A
    if (typeof value !== 'number' || isNaN(value) || value === 'N/A' || value === 'n/a' ||
        (typeof value === 'string' && value.trim() === '')) {
      console.warn('getScoreColor: non-numeric or N/A value:', value, 'for dimension:', dimensionKey);
      return 'no-ranking'; // Special value to indicate no ranking should be applied
    }

    // Use the higherBetter parameter passed to the function
    // If not provided, fall back to the utility function
    const isHigherBetterMetric = higherBetter !== undefined ? higherBetter : isHigherBetter(dimensionKey.split('.')[0], dimensionKey.split('.')[1]);

    let normalized = (value - min) / (max - min);
    if (!isHigherBetterMetric) {
      normalized = (max - value) / (max - min);
    }



    if (normalized >= 0.8) return 'excellent';
    if (normalized >= 0.2) return 'average';
    return 'poor';
  };

    const renderValue = (city, dimension) => {
    try {
      const key = dimension.key || dimension;
      if (key.includes('.')) {
        const keys = key.split('.');
        let value = city;
        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) return 'N/A';
        }

        const category = keys[0];
        const metric = dimension.metric || keys[keys.length - 1];

        if (metric === 'monthlyData') return 'See details';

        // Safe array access for coordinates
        if (metric === 'coordinates') {
          if (Array.isArray(value) && value.length >= 2) {
            return `${value[0].toFixed(2)}, ${value[1].toFixed(2)}`;
          }
          return 'N/A';
        }



        // Handle array metrics (counts of places)
        if (Array.isArray(value)) {
          return formatArrayMetric(value);
        }

        // Use standardized formatters for known metrics
        if (typeof value === 'number' && !isNaN(value)) {
          // Special handling for travel time metrics
          if (key === 'transportation.distanceToParisWithCar' ||
              key === 'transportation.distanceToParisWithTrain' ||
              key === 'transportation.distanceToLyonWithCar' ||
              key === 'transportation.distanceToLyonWithTrain') {
            // Return 'N/A' for 0 values (no data)
            if (value === 0) {
              return 'N/A';
            }
            return formatMetric('transportation', key.split('.')[1], value);
          }
          return formatMetric(category, metric, value);
        }

        // Ensure we return a string or number, not an object
        if (typeof value === 'object' && value !== null) {
          console.warn('renderValue: returning object for metric:', metric, 'value:', value);
          return 'N/A';
        }

        return value || 'N/A';
      }

      const value = city[key];

      // Handle array metrics (counts of places)
      if (Array.isArray(value)) {
        return formatArrayMetric(value);
      }

      // Use standardized formatters for known metrics
      if (typeof value === 'number' && !isNaN(value)) {
        // Special handling for travel time metrics
        if (key === 'transportation.distanceToParisWithCar' ||
            key === 'transportation.distanceToParisWithTrain' ||
            key === 'transportation.distanceToLyonWithCar' ||
            key === 'transportation.distanceToLyonWithTrain') {
          // Return 'N/A' for 0 values (no data)
          if (value === 0) {
            return 'N/A';
          }
          return formatMetric('transportation', key, value);
        }
        const category = key;
        return formatMetric(category, key, value);
      }

      // Ensure we return a string or number, not an object
      if (typeof value === 'object' && value !== null) {
        console.warn('renderValue: returning object for key:', key, 'value:', value);
        return 'N/A';
      }

      return value || 'N/A';
    } catch (error) {
      console.error('Error in renderValue:', error, { city, dimension });
      return 'N/A';
    }
  };



    // Generate dimensions dynamically from centralized configuration
    const dimensionGroups = Object.entries(METRIC_CONFIG).map(([category, config]) => ({
      name: config.title,
      dimensions: Object.entries(config.metrics).map(([metricKey, metricConfig]) => ({
        key: `${category}.${metricKey}`,
        label: metricConfig.label,
        icon: metricConfig.icon,
        tooltip: metricConfig.tooltip,
        type: metricConfig.type,
        higherBetter: metricConfig.higherBetter,
        sourceUrl: metricConfig.sourceUrl
      }))
    }));

  // Reference cities are now included in the cities array from context

  // All cities are now included in the cities array from context
  const allCities = cities || [];

    return (
    <div className="comparison-table-container" style={{ position: 'relative' }}>
            {/* Sticky header clone for perfect alignment */}
      {isHeaderSticky && (
        <div className="sticky-header-clone">
          <table className="comparison-table">
            <thead>
              {/* Reference cities header row */}
              <tr className="reference-header-row">
                <th className="empty-cell"></th>
                {allCities.map(city => {
                  const isReferenceCity = city.id === 'lyon' || city.id === 'oakland';
                  return (
                    <th key={`ref-${city.id}`} className={`reference-header-cell ${isReferenceCity ? 'is-reference' : 'not-reference'}`}>
                      {isReferenceCity ? 'Reference' : ''}
                    </th>
                  );
                })}
              </tr>
              {/* Main city names row */}
              <tr>
                <th className="icon-column-header">Metric</th>
                {allCities.map(city => (
                  <th key={city.id} className="city-header">
                    <a
                      href={`/city/${city.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="city-link"
                    >
                      {city.name}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
      )}

      <div className="table-wrapper">
        <table className="comparison-table" ref={tableRef}>
          <thead>
            {/* Reference cities header row */}
            <tr className="reference-header-row">
              <th className="empty-cell"></th>
              {allCities.map(city => {
                const isReferenceCity = city.id === 'lyon' || city.id === 'oakland';
                return (
                  <th key={`ref-${city.id}`} className={`reference-header-cell ${isReferenceCity ? 'is-reference' : 'not-reference'}`}>
                    {isReferenceCity ? 'Reference' : ''}
                  </th>
                );
              })}
            </tr>
            {/* Main city names row */}
            <tr>
              <th className="icon-column-header">Metric</th>
              {allCities.map(city => (
                <th key={city.id} className="city-header">
                  <a
                    href={`/city/${city.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="city-link"
                  >
                    {city.name}
                  </a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dimensionGroups.map(group => (
              <Fragment key={group.name}>
                <tr className="group-header">
                  <td colSpan={allCities.length + 1} className="group-title">
                    <button
                      className="group-toggle-btn"
                      onClick={() => toggleGroup(group.name)}
                      aria-label={`${collapsedGroups[group.name] ? 'Expand' : 'Collapse'} ${group.name} section`}
                    >
                      {collapsedGroups[group.name] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      <span>{group.name}</span>
                    </button>
                  </td>
                </tr>
                {!collapsedGroups[group.name] && group.dimensions.map(dimension => {
                  const IconComponent = dimension.icon;
                  return (
                    <tr key={dimension.key}>
                      <td className="metric-icon-cell">
                        <div className="metric-label-container">
                          <IconComponent size={16} className="metric-icon" />
                          <span className="metric-text">{dimension.label}</span>
                          <span
                          className="metric-tooltip"
                          onMouseEnter={(e) => showTooltip(e, dimension)}
                          onMouseLeave={hideTooltip}
                        >
                          ?
                        </span>

                        </div>
                      </td>
                      {allCities.map(city => {
                        try {
                          const value = renderValue(city, dimension);

                          // Ensure the value is a valid React child
                          let displayValue = value;
                          if (value === null || value === undefined) {
                            displayValue = 'N/A';
                          } else if (typeof value === 'object') {
                            console.warn('renderValue returned object:', value, 'for city:', city.name, 'dimension:', dimension.key);
                            displayValue = 'N/A';
                          }

                          let colorClass = 'neutral';
                          if (dimension.type === 'number' && dimension.higherBetter !== undefined) {
                            try {
                              let scoreValue;
                              if (dimension.key === 'transportation.distanceToParisWithCar') {
                                scoreValue = city.transportation?.distanceToParisWithCar;
                              } else if (dimension.key === 'transportation.distanceToParisWithTrain') {
                                scoreValue = city.transportation?.distanceToParisWithTrain;
                              } else if (dimension.key === 'transportation.distanceToLyonWithCar') {
                                scoreValue = city.transportation?.distanceToLyonWithCar;
                              } else if (dimension.key === 'transportation.distanceToLyonWithTrain') {
                                scoreValue = city.transportation?.distanceToLyonWithTrain;
                              } else if (dimension.metric && dimension.metric.includes('.')) {
                                // For other nested metrics
                                const [, childKey] = dimension.metric.split('.');
                                const category = dimension.key.split('.')[0];
                                const subCategory = dimension.key.split('.')[1];
                                scoreValue = city[category]?.[subCategory]?.[childKey];

                              } else if (dimension.key.includes('.')) {
                                // For regular nested metrics
                                const [category, metric] = dimension.key.split('.');
                                const metricValue = city[category]?.[metric];
                                // Handle array metrics by returning their length
                                if (Array.isArray(metricValue)) {
                                  scoreValue = metricValue.length;
                                } else {
                                  scoreValue = metricValue;
                                }
                              } else {
                                // For simple metrics
                                const metricValue = city[dimension.key];
                                // Handle array metrics by returning their length
                                if (Array.isArray(metricValue)) {
                                  scoreValue = metricValue.length;
                                } else {
                                  scoreValue = metricValue;
                                }
                              }

                              // Check if this should be excluded from ranking
                              let shouldExcludeFromRanking = false;

                              // For travel time metrics, exclude 0 values (no data)
                              if (dimension.key === 'transportation.distanceToParisWithCar' ||
                                  dimension.key === 'transportation.distanceToParisWithTrain' ||
                                  dimension.key === 'transportation.distanceToLyonWithCar' ||
                                  dimension.key === 'transportation.distanceToLyonWithTrain') {
                                if (scoreValue === 0 || scoreValue === undefined || scoreValue === null) {
                                  shouldExcludeFromRanking = true;
                                }
                              }

                              // If renderValue returned 'N/A' or we should exclude from ranking, don't apply ranking colors
                              if (value === 'N/A' || shouldExcludeFromRanking) {
                                colorClass = 'no-ranking';
                              } else {
                                // For travel time metrics, pass the full metric path for proper color coding
                                const dimensionKey = dimension.metric || dimension.key;

                                const scoreColor = getScoreColor(scoreValue, dimensionKey, cities, dimension.higherBetter);

                                // Only apply color class if we got a valid ranking color
                                if (scoreColor !== 'no-ranking') {
                                  colorClass = scoreColor;
                                }
                              }
                            } catch (error) {
                              console.error('Error in color coding:', error);
                              colorClass = 'neutral';
                            }
                          }

                          return (
                            <td key={city.id} className={`value-cell ${colorClass}`}>
                              {displayValue}
                            </td>
                          );
                        } catch (error) {
                          console.error('Error rendering city value:', error, { city, dimension });
                          return (
                            <td key={city.id} className="value-cell neutral">
                              Error
                            </td>
                          );
                        }
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

            {/* Custom Tooltip */}
      {tooltip.show && tooltip.content && (
        <div
          className="custom-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.position.x,
            top: tooltip.position.y,
            transform: 'translateX(-50%)',
            zIndex: 10000
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="tooltip-content">
            <div className="tooltip-description">
              {tooltip.content.tooltip}
            </div>
            {tooltip.content.sourceUrl && (
              <div className="tooltip-source">
                Data source: <a
                  href={tooltip.content.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tooltip-source-link"
                >
                  {getDataSourceName(tooltip.content.sourceUrl)}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ComparisonTable;
