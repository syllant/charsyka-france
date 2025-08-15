import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Bar } from 'recharts';
import { useCities } from '../context/CityContext';
import { ArrowLeft } from 'lucide-react';
import { METRIC_CONFIG } from '../config/metrics';
import 'leaflet/dist/leaflet.css';
import InfoDrawer from './InfoDrawer';


import ScaleBar from './ScaleBar';

import { getSectionTitle, getMetricLabel, getMetricConfig } from '../config/metrics';

const CityDetailPage = () => {
  const { cityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { cities, getCityById } = useCities();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState({ title: '', items: [], itemType: '' });
  const [tooltip, setTooltip] = useState({ show: false, content: null, position: { x: 0, y: 0 }, hovering: false });

  const [activeMapLayer, setActiveMapLayer] = useState('standard');
  const [activeSection, setActiveSection] = useState('map');

  // Image modal state
  const [imageModal, setImageModal] = useState({ open: false, image: null, alt: '' });

  // Get city data from context
  const city = getCityById(cityId);

  // Handle URL hash for deep linking
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['map', 'gallery', 'weather', 'population', 'education', 'culture', 'transportation', 'geography', 'housing', 'qualityOfLife'].includes(hash)) {
      setActiveSection(hash);
    }
  }, [location.hash]);

  // Update URL when section changes
  useEffect(() => {
    if (activeSection && activeSection !== 'map') {
      navigate(`/city/${cityId}#${activeSection}`, { replace: true });
    } else {
      navigate(`/city/${cityId}`, { replace: true });
    }
  }, [activeSection, cityId, navigate]);

  // Handle keyboard events for image modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (imageModal.open && event.key === 'Escape') {
        closeImageModal();
      }
    };

    if (imageModal.open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [imageModal.open]);

  // Debug: log city data to see what we're working with


  if (!city) {
    return <div>City not found</div>;
  }





  const weatherData = city.weather?.monthlyData?.map((temp, index) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index],
    avgTemp: temp,
    minTemp: temp - 5, // Approximate min temp
    maxTemp: temp + 5  // Approximate max temp
  })) || [];

  const monthlyWeatherData = city.weather?.monthlySunnyDays?.map((sunny, index) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index],
    sunnyDays: sunny,
    rainyDays: city.weather.monthlyRainyDays?.[index] || 0,
    precipitation: city.weather.monthlyPrecipitation?.[index] || 0
  })) || [];

  const openDrawer = (title, items, itemType) => {
    setDrawerData({ title, items, itemType });
    setDrawerOpen(true);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const openImageModal = (image, alt) => {
    setImageModal({ open: true, image, alt });
  };

  const closeImageModal = () => {
    setImageModal({ open: false, image: null, alt: '' });
  };

  // Tooltip functions from ComparisonTable
  const showTooltip = (e, dimension) => {
    const rect = e.target.getBoundingClientRect();
    setTooltip({
      show: true,
      content: dimension,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      },
      hovering: false
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

  // Function to get data source name (from ComparisonTable)
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

  // Helper function to create metric label with help button
  const createMetricLabelWithHelp = (category, metricKey) => {
    const config = getMetricConfig(category, metricKey);
    const IconComponent = config?.icon;

    return (
      <>
        {IconComponent && <IconComponent size={16} />}
        {getMetricLabel(category, metricKey)}:
        {config && (
          <span
            className="metric-tooltip"
            onMouseEnter={(e) => showTooltip(e, {
              tooltip: config.tooltip,
              sourceUrl: config.sourceUrl
            })}
            onMouseLeave={hideTooltip}
          >
            ?
          </span>
        )}
      </>
    );
  };





  const getCityValue = (cityItem, dimensionPath) => {
    try {
      if (dimensionPath.includes('.')) {
        const keys = dimensionPath.split('.');
        let value = cityItem;
        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) return null;
        }
        // Handle array metrics by returning their length
        if (Array.isArray(value)) {
          return value.length;
        }
        // Return null for N/A values so they can be excluded from rankings
        if (value === 'N/A' || value === 'n/a' || (typeof value === 'string' && value.trim() === '')) {
          return null;
        }
        return value || null;
      }
      const value = cityItem[dimensionPath];
      // Handle array metrics by returning their length
      if (Array.isArray(value)) {
        return value.length;
      }
      // Return null for N/A values so they can be excluded from rankings
      if (value === 'N/A' || value === 'n/a' || (typeof value === 'string' && value.trim() === '')) {
        return null;
      }
      return value || null;
    } catch (error) {
      console.error('Error getting city value:', error, { cityItem, dimensionPath });
      return null;
    }
  };



  // Map layer configuration using Thunderforest tiles for different map styles
  const mapLayers = {
    standard: {
      name: 'Standard',
      description: 'Complete OpenStreetMap view with all features',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    transport: {
      name: 'Transport',
      description: 'Transport-focused view highlighting roads, transit, and infrastructure',
      url: 'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=cc2d98e631394c2eb990c69ea6de10a3',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.thunderforest.com/">Thunderforest</a>'
    },
    cycle: {
      name: 'Cycling',
      description: 'Cycling-focused view highlighting bike lanes and cycling routes',
      url: 'https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=cc2d98e631394c2eb990c69ea6de10a3',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.thunderforest.com/">Thunderforest</a>'
    },
    landscape: {
      name: 'Landscape',
      description: 'Landscape view with terrain, elevation, and natural features',
      url: 'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=cc2d98e631394c2eb990c69ea6de10a3',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.thunderforest.com/">Thunderforest</a>'
    },
    outdoors: {
      name: 'Outdoors',
      description: 'Outdoor recreation view highlighting parks, trails, and natural features',
      url: 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=cc2d98e631394c2eb990c69ea6de10a3',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.thunderforest.com/">Thunderforest</a>'
    },
    neighbourhood: {
      name: 'Neighbourhood',
      description: 'Neighbourhood view optimized for local area exploration',
      url: 'https://{s}.tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=cc2d98e631394c2eb990c69ea6de10a3',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.thunderforest.com/">Thunderforest</a>'
    }
  };





  return (
    <div className="city-detail-page">
            <header
        className="city-detail-header"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${
            city.images && city.images.length > 0
              ? (typeof city.images[0] === 'string' ? city.images[0] : city.images[0].url)
              : 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'
          })`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >

        <div className="header-content">
          {/* Center: City name */}
          <div className="header-center">
            <h1 className="city-title">{city.name}</h1>
            <div className="city-subtitle">{city.region}</div>
          </div>

          {/* Unified Navigation Bar */}
          <div className="unified-nav">
            <button className="nav-button back-button" onClick={() => navigate('/')}>
              <ArrowLeft size={16} />
              <span>List</span>
            </button>

            <div className="nav-divider"></div>

            <div className="city-switcher">
              <select
                key={`city-switcher-${cityId}`}
                value={cityId}
                onChange={(e) => navigate(`/city/${e.target.value}`)}
                className="city-select"
              >
                {cities.map(cityOption => (
                  <option key={cityOption.id} value={cityOption.id}>
                    {cityOption.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="city-content">
        <div className="city-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${activeSection === 'map' ? 'active' : ''}`}
              onClick={() => handleSectionChange('map')}
            >
              Map
            </button>
            <button
              className={`sidebar-nav-item ${activeSection === 'gallery' ? 'active' : ''}`}
              onClick={() => handleSectionChange('gallery')}
            >
              Gallery
            </button>
            {city.weather && (
              <button
                className={`sidebar-nav-item ${activeSection === 'weather' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('weather')}
      >
        {getSectionTitle('weather')}
              </button>
            )}
            {city.population && (
              <button
                className={`sidebar-nav-item ${activeSection === 'population' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('population')}
              >
                {getSectionTitle('population')}
              </button>
            )}
            {city.education && (
              <button
                className={`sidebar-nav-item ${activeSection === 'education' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('education')}
      >
        {getSectionTitle('education')}
              </button>
            )}
            {city.culture && (
              <button
                className={`sidebar-nav-item ${activeSection === 'culture' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('culture')}
      >
        {getSectionTitle('culture')}
              </button>
            )}
            {city.transportation && (
              <button
                className={`sidebar-nav-item ${activeSection === 'transportation' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('transportation')}
      >
        {getSectionTitle('transportation')}
              </button>
            )}
            {city.geography && (
              <button
                className={`sidebar-nav-item ${activeSection === 'geography' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('geography')}
      >
        {getSectionTitle('geography')}
              </button>
            )}
            {city.housing && (
              <button
                className={`sidebar-nav-item ${activeSection === 'housing' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('housing')}
      >
        {getSectionTitle('housing')}
              </button>
            )}
            {city.qualityOfLife && (
              <button
                className={`sidebar-nav-item ${activeSection === 'qualityOfLife' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('qualityOfLife')}
      >
        {getSectionTitle('qualityOfLife')}
              </button>
            )}
          </nav>
        </div>

        <div className="city-main-content">
          {/* Map Section */}
          {activeSection === 'map' && (
            <div className="content-section">
              <h2>Map</h2>
              <div className="map-controls">
                <div className="map-layer-selector">
                  <label htmlFor="map-layer">Map Style:</label>
                <select
                    id="map-layer"
                  value={activeMapLayer}
                  onChange={(e) => setActiveMapLayer(e.target.value)}
                >
                  {Object.entries(mapLayers).map(([key, layer]) => (
                      <option key={key} value={key}>{layer.name}</option>
                  ))}
                </select>
                  <div className="map-layer-description">
                  {mapLayers[activeMapLayer].description}
                </div>
              </div>
            </div>
            {city.coordinates && (
              <MapContainer
                key={`${city.id}-map-${activeMapLayer}`}
                center={city.coordinates}
                zoom={10}
                  style={{ height: '500px', width: '100%' }}
              >
                <TileLayer
                  url={mapLayers[activeMapLayer].url}
                  attribution={mapLayers[activeMapLayer].attribution}
                />
                <Marker position={city.coordinates}>
                  <Popup>
                    <div>
                      <h3>{city.name}</h3>
                      <p>{city.region}</p>
                    </div>
                  </Popup>
                </Marker>

                                {/* Add POI markers based on selected layer */}
                {activeMapLayer === 'neighbourhood' && city.education?.highSchools && city.education.highSchools.map((school, index) => (
                  <Marker
                    key={`school-${index}`}
                    position={school.coordinates}
                    icon={L.divIcon({
                      className: 'custom-div-icon',
                      html: `<div style="background-color: #4caf50; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">S</div>`,
                      iconSize: [20, 20],
                      iconAnchor: [10, 10]
                    })}
                  >
                    <Popup>
                      <div>
                        <h4>🏫 {school.name}</h4>
                        {school.description && <p>{school.description}</p>}
                        {school.rating && <p>Rating: {school.rating}/5</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
          )}

          {/* Gallery Section */}
          {activeSection === 'gallery' && (
            <div className="content-section">
              <h2>Gallery</h2>
              <div className="gallery-grid">
                              {city.images && city.images.length > 0 ? (
                city.images
                  .filter(image => !image.isBanner) // Filter out banner image
                  .map((image, index) => {
                    const imageUrl = typeof image === 'string' ? image : image.url;
                    const imageAlt = typeof image === 'string' ? `${city.name} attraction ${index + 1}` : image.alt;

                    return (
                                          <div
                      key={index}
                      className="gallery-item"
                      onClick={() => openImageModal(imageUrl, imageAlt)}
                      title={imageAlt}
                    >
                        <img
                          src={`${imageUrl}?w=250&h=200&fit=crop`}
                          alt={imageAlt}
                          onError={(e) => {
                            console.log('Image failed to load:', imageUrl);
                            e.target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=250&h=200&fit=crop';
                            e.target.alt = 'Fallback image';
                          }}
                          onLoad={() => {
                            console.log('Gallery image loaded successfully:', imageUrl);
                          }}
                        />
                      </div>
                    );
                  })
              ) : (
                  <div className="no-images">
                    <p>No images available for {city.name}</p>
                    <p>Debug: city.images = {JSON.stringify(city.images)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Population Section */}
          {activeSection === 'population' && city.population && (
            <div className="content-section">
              <h2>{getSectionTitle('population')}</h2>
              <div className="data-grid">
                {Object.entries(city.population).map(([key, value]) => {
                  if (key === 'dataQuality' || key.endsWith('Details')) return null;
                  return (
                    <div key={key} className="data-item">
                      <div className="new-layout-row">
                        <span className="data-label metric-label-with-icon">
                          {createMetricLabelWithHelp('population', key)}
                        </span>
                        {/* Placeholder to maintain alignment when no view button */}
                        <div className="view-button-placeholder"></div>
                        {getCityValue(city, `population.${key}`) !== null && getCityValue(city, `population.${key}`) !== undefined && (
                          <ScaleBar
                            cityValues={cities.map(c => {
                              const val = c.population?.[key];
                              return Array.isArray(val) ? val.length : val;
                            }).filter(v => v !== undefined && v !== null && v !== 'N/A' && v !== 'n/a' && !isNaN(v))}
                            currentValue={getCityValue(city, `population.${key}`)}
                            metricKey={`population.${key}`}
                            higherBetter={METRIC_CONFIG.population?.metrics?.[key]?.higherBetter ?? true}
                            cities={cities}
                          />
                        )}
        </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Education Section */}
          {activeSection === 'education' && city.education && (
            <div className="content-section">
              <h2>{getSectionTitle('education')}</h2>
              <div className="data-grid">
                {Object.entries(city.education).map(([key, value]) => {
                  if (key === 'dataQuality' || key.endsWith('Details')) return null;
                  return (
                    <div key={key} className="data-item">
                      <div className="new-layout-row">
                        <span className="data-label metric-label-with-icon">
                          {createMetricLabelWithHelp('education', key)}
                        </span>
                        <div className="view-button-placeholder"></div>
                        {getCityValue(city, `education.${key}`) !== null && getCityValue(city, `education.${key}`) !== undefined && (
                          <ScaleBar
                            cityValues={cities.map(c => {
                              const val = c.education?.[key];
                              return Array.isArray(val) ? val.length : val;
                            }).filter(v => v !== undefined && v !== null && v !== 'N/A' && v !== 'n/a' && !isNaN(v))}
                            currentValue={getCityValue(city, `education.${key}`)}
                            metricKey={`education.${key}`}
                            higherBetter={METRIC_CONFIG.education?.metrics?.[key]?.higherBetter ?? true}
                            cities={cities}
                            hasViewList={Array.isArray(value) && value.length > 0}
                            onViewList={(metricKey) => {
                              openDrawer(
                                `${getMetricLabel('education', key)} in ${city.name}`,
                                value,
                                key
                              );
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Culture Section */}
          {activeSection === 'culture' && city.culture && (
            <div className="content-section">
              <h2>{getSectionTitle('culture')}</h2>
              <div className="data-grid">
                {Object.entries(city.culture).map(([key, value]) => {
                  if (key === 'dataQuality' || key.endsWith('Details')) return null;
                  return (
                    <div key={key} className="data-item">
                      <div className="new-layout-row">
                        <span className="data-label metric-label-with-icon">
                          {createMetricLabelWithHelp('culture', key)}
                        </span>
                        <div className="view-button-placeholder"></div>
                        {getCityValue(city, `culture.${key}`) !== null && getCityValue(city, `culture.${key}`) !== undefined && (
                          <ScaleBar
                            cityValues={cities.map(c => {
                              const val = c.culture?.[key];
                              return Array.isArray(val) ? val.length : val;
                            })}
                            currentValue={getCityValue(city, `culture.${key}`)}
                            metricKey={`culture.${key}`}
                            higherBetter={METRIC_CONFIG.culture?.metrics?.[key]?.higherBetter ?? true}
                            cities={cities}
                            hasViewList={Array.isArray(value) && value.length > 0}
                            onViewList={(metricKey) => {
                              openDrawer(
                                `${getMetricLabel('culture', key)} in ${city.name}`,
                                value,
                                key
                              );
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transportation Section */}
          {activeSection === 'transportation' && city.transportation && (
            <div className="content-section">
              <h2>{getSectionTitle('transportation')}</h2>
              <div className="data-grid">
                {Object.entries(city.transportation).map(([key, value]) => {
                  if (key === 'dataQuality' || key.endsWith('Details')) return null;
                  return (
                    <div key={key} className="data-item">
                      <div className="new-layout-row">
                        <span className="data-label metric-label-with-icon">
                          {createMetricLabelWithHelp('transportation', key)}
                        </span>
                        {/* Placeholder to maintain alignment when no view button */}
                        <div className="view-button-placeholder"></div>
                        {getCityValue(city, `transportation.${key}`) !== null && getCityValue(city, `transportation.${key}`) !== undefined && (
                          <ScaleBar
                            cityValues={cities.map(c => {
                              const val = c.transportation?.[key];
                              return Array.isArray(val) ? val.length : val;
                            }).filter(v => v !== undefined && v !== null && v !== 'N/A' && v !== 'n/a' && !isNaN(v))}
                            currentValue={getCityValue(city, `transportation.${key}`)}
                            metricKey={`transportation.${key}`}
                            higherBetter={METRIC_CONFIG.transportation?.metrics?.[key]?.higherBetter ?? true}
                            cities={cities}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Geography Section */}
          {activeSection === 'geography' && city.geography && (
            <div className="content-section">
              <h2>{getSectionTitle('geography')}</h2>
              <div className="data-grid">
                {Object.entries(city.geography).map(([key, value]) => {
                  if (key === 'dataQuality' || key.endsWith('Details')) return null;
                  return (
                    <div key={key} className="data-item">
                      <div className="new-layout-row">
                        <span className="data-label metric-label-with-icon">
                          {createMetricLabelWithHelp('geography', key)}
                        </span>
                        <div className="view-button-placeholder"></div>
                        {getCityValue(city, `geography.${key}`) !== null && getCityValue(city, `geography.${key}`) !== undefined && (
                          <ScaleBar
                            cityValues={cities.map(c => {
                              const val = c.geography?.[key];
                              return Array.isArray(val) ? val.length : val;
                            }).filter(v => v !== undefined && v !== null && v !== 'N/A' && v !== 'n/a' && !isNaN(v))}
                            currentValue={getCityValue(city, `geography.${key}`)}
                            metricKey={`geography.${key}`}
                            higherBetter={METRIC_CONFIG.geography?.metrics?.[key]?.higherBetter ?? true}
                            cities={cities}
                            hasViewList={Array.isArray(value) && value.length > 0}
                            onViewList={(metricKey) => {
                              openDrawer(
                                `${getMetricLabel('geography', key)} in ${city.name}`,
                                value,
                                key
                              );
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Housing Section */}
          {activeSection === 'housing' && city.housing && (
            <div className="content-section">
              <h2>{getSectionTitle('housing')}</h2>
              <div className="data-grid">
                {Object.entries(city.housing).map(([key, value]) => {
                  if (key === 'dataQuality' || key.endsWith('Details')) return null;
                  return (
                    <div key={key} className="data-item">
                      <div className="new-layout-row">
                        <span className="data-label metric-label-with-icon">
                          {createMetricLabelWithHelp('housing', key)}
                        </span>
                        {/* Placeholder to maintain alignment when no view button */}
                        <div className="view-button-placeholder"></div>
                        {getCityValue(city, `housing.${key}`) !== null && getCityValue(city, `housing.${key}`) !== undefined && (
                          <ScaleBar
                            cityValues={cities.map(c => {
                              const val = c.housing?.[key];
                              return Array.isArray(val) ? val.length : val;
                            }).filter(v => v !== undefined && v !== null && v !== 'N/A' && v !== 'n/a' && !isNaN(v))}
                            currentValue={getCityValue(city, `housing.${key}`)}
                            metricKey={`housing.${key}`}
                            higherBetter={METRIC_CONFIG.housing?.metrics?.[key]?.higherBetter ?? true}
                            cities={cities}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quality of Life Section */}
          {activeSection === 'qualityOfLife' && city.qualityOfLife && (
            <div className="content-section">
              <h2>{getSectionTitle('qualityOfLife')}</h2>
              <div className="data-grid">
                {Object.entries(city.qualityOfLife).map(([key, value]) => {
                  if (key === 'dataQuality' || key.endsWith('Details')) return null;
                  return (
                    <div key={key} className="data-item">
                      <div className="new-layout-row">
                        <span className="data-label metric-label-with-icon">
                          {createMetricLabelWithHelp('qualityOfLife', key)}
                        </span>
                        {/* Placeholder to maintain alignment when no view button */}
                        <div className="view-button-placeholder"></div>
                        {getCityValue(city, `qualityOfLife.${key}`) !== null && getCityValue(city, `qualityOfLife.${key}`) !== undefined && (
                          <ScaleBar
                            cityValues={cities.map(c => {
                              const val = c.qualityOfLife?.[key];
                              return Array.isArray(val) ? val.length : val;
                            }).filter(v => v !== undefined && v !== null && v !== 'N/A' && v !== 'n/a' && !isNaN(v))}
                            currentValue={getCityValue(city, `qualityOfLife.${key}`)}
                            metricKey={`qualityOfLife.${key}`}
                            higherBetter={METRIC_CONFIG.qualityOfLife?.metrics?.[key]?.higherBetter ?? true}
                            cities={cities}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weather Section */}
          {activeSection === 'weather' && city.weather && (
            <div className="content-section">
              <h2>Weather</h2>

              {/* Weather Charts */}
              <div className="weather-charts-container">
                <div className="weather-chart-large">
                  <h3>Monthly Temperature</h3>
                  {weatherData.length > 0 && (
                    <LineChart width={500} height={300} data={weatherData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="minTemp"
                        stroke="#ffb3ba"
                        strokeWidth={3}
                        name="Min Temp"
                      />
                      <Line
                        type="monotone"
                        dataKey="maxTemp"
                        stroke="#ffcc80"
                        strokeWidth={3}
                        name="Max Temp"
                      />
                      <Line
                        type="monotone"
                        dataKey="avgTemp"
                        stroke="#a5d6a7"
                        strokeWidth={3}
                        name="Avg Temp"
                      />
                    </LineChart>
                  )}
                </div>

                <div className="weather-chart-large">
                  <h3>Monthly Weather Conditions</h3>
                  {city.weather.monthlySunnyDays && city.weather.monthlyRainyDays && city.weather.monthlyPrecipitation && (
                    <ComposedChart width={500} height={300} data={monthlyWeatherData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="sunnyDays"
                        fill="#ffd54f"
                        name="Sunny Days"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="rainyDays"
                        fill="#81c784"
                        name="Rainy Days"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="precipitation"
                        stroke="#2196f3"
                        strokeWidth={3}
                        name="Precipitation (mm)"
                      />
                    </ComposedChart>
                  )}
                </div>
              </div>

              {/* Weather Metrics */}
              <div className="data-grid">
                <div className="data-item">
                  <div className="new-layout-row">
                    <span className="data-label metric-label-with-icon">
                      {createMetricLabelWithHelp('weather', 'avgTemp')}
                    </span>
                    {/* Placeholder to maintain alignment when no view button */}
                    <div className="view-button-placeholder"></div>
                    <ScaleBar
                      cityValues={cities.map(cityItem => cityItem.weather?.avgTemp).filter(v => v !== undefined && v !== null)}
                      currentValue={city.weather?.avgTemp}
                      metricKey="weather.avgTemp"
                      higherBetter={METRIC_CONFIG.weather?.metrics?.avgTemp?.higherBetter ?? true}
                      cities={cities}
                    />
                  </div>
                </div>

                <div className="data-item">
                  <div className="new-layout-row">
                    <span className="data-label metric-label-with-icon">
                      {createMetricLabelWithHelp('weather', 'sunnyDays')}
                    </span>
                    {/* Placeholder to maintain alignment when no view button */}
                    <div className="view-button-placeholder"></div>
                    <ScaleBar
                      cityValues={cities.map(cityItem => cityItem.weather?.sunnyDays).filter(v => v !== undefined && v !== null)}
                      currentValue={city.weather?.sunnyDays}
                      metricKey="weather.sunnyDays"
                      higherBetter={METRIC_CONFIG.weather?.metrics?.sunnyDays?.higherBetter ?? true}
                      cities={cities}
                    />
                  </div>
                </div>

                <div className="data-item">
                  <div className="new-layout-row">
                    <span className="data-label metric-label-with-icon">
                      {createMetricLabelWithHelp('weather', 'rainyDays')}
                    </span>
                    {/* Placeholder to maintain alignment when no view button */}
                    <div className="view-button-placeholder"></div>
                    <ScaleBar
                      cityValues={cities.map(cityItem => cityItem.weather?.rainyDays).filter(v => v !== undefined && v !== null)}
                      currentValue={city.weather?.rainyDays}
                      metricKey="weather.rainyDays"
                      higherBetter={METRIC_CONFIG.weather?.metrics?.rainyDays?.higherBetter ?? true}
                      cities={cities}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
            </div>
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

            {/* Image Modal */}
      {imageModal.open && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div
            className={`image-modal-content ${imageModal.orientation || 'landscape'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="image-modal-close" onClick={closeImageModal}>
              ×
            </button>
            <img
              src={imageModal.image}
              alt={imageModal.alt}
              className="image-modal-image"
              onLoad={(e) => {
                // Detect image orientation and update modal class
                const img = e.target;
                const orientation = img.naturalWidth > img.naturalHeight ? 'landscape' : 'portrait';
                if (orientation !== imageModal.orientation) {
                  setImageModal(prev => ({ ...prev, orientation }));
                }
              }}
            />
            <div className="image-modal-caption">
              {imageModal.alt}
            </div>
          </div>
        </div>
      )}

      {/* Info Drawer */}
      <InfoDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerData.title}
        items={drawerData.items}
        itemType={drawerData.itemType}
      />
    </div>
  );
};

export default CityDetailPage;
