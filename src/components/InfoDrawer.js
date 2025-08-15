import React, { useEffect, useRef, useMemo } from 'react';
import { X, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { formatMetric } from '../utils/metricFormatters';
import './InfoDrawer.css';

const InfoDrawer = ({ isOpen, onClose, title, items, itemType }) => {
  const mapRef = useRef(null);

  // Sort items alphabetically by name
  const sortedItems = useMemo(() => {
    return items ? [...items].sort((a, b) => {
      if (!a.name || !b.name) return 0;
      return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    }) : [];
  }, [items]);

  // Effect to fit map bounds when items change
  useEffect(() => {
    if (mapRef.current && sortedItems && sortedItems.length > 0) {
      const itemsWithCoords = sortedItems.filter(item => item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length === 2);

      if (itemsWithCoords.length > 0) {
        // Wait for map to be ready
        setTimeout(() => {
          const map = mapRef.current;
          if (map) {
            const bounds = [
              [Math.min(...itemsWithCoords.map(item => item.coordinates[0])), Math.min(...itemsWithCoords.map(item => item.coordinates[1]))],
              [Math.max(...itemsWithCoords.map(item => item.coordinates[0])), Math.max(...itemsWithCoords.map(item => item.coordinates[1]))]
            ];
            map.fitBounds(bounds, { padding: [20, 20] });
          }
        }, 100);
      }
    }
  }, [items, sortedItems]);

  // Fix Leaflet marker icons
  useEffect(() => {
    // Import Leaflet dynamically to avoid SSR issues
    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
        iconUrl: require('leaflet/dist/images/marker-icon.png'),
        shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
      });
    });
  }, []);

  if (!isOpen) return null;

  const renderItem = (item, index) => {



    return (
      <div key={index} className="drawer-item">
        <div className="item-header">
          <h4 className="item-name">{item.name}</h4>
          {item.rating && (
            <a
              href={(() => {
                // Create appropriate link based on rating source
                if (item.ratingSource === 'Google Reviews') {
                  return `https://www.google.com/search?q=${encodeURIComponent(item.name + ' ' + item.address + ' reviews')}`;
                } else if (item.ratingSource === 'TripAdvisor') {
                  return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(item.name + ' ' + item.address)}`;
                } else if (item.ratingSource === 'Yelp') {
                  return `https://www.yelp.com/search?find_desc=${encodeURIComponent(item.name + ' ' + item.address)}`;
                } else {
                  // Default to Google search for unknown sources
                  return `https://www.google.com/search?q=${encodeURIComponent(item.name + ' ' + item.address + ' reviews')}`;
                }
              })()}
              target="_blank"
              rel="noopener noreferrer"
              className="item-rating-link"
              title={`View ${item.ratingSource || 'reviews'} for ${item.name}`}
            >
              ★ {item.rating}
              {item.ratingSource && <span className="rating-source"> ({item.ratingSource})</span>}
            </a>
          )}
        </div>

        {item.description && (
          <p className="item-description">{item.description}</p>
        )}

        <div className="item-links">

          {/* AllTrails link */}
          {item.allTrailsUrl && (
            <a
              href={item.allTrailsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="item-link alltrails-link"
              title="Search on AllTrails"
            >
              <MapPin size={16} />
              <span>AllTrails</span>
            </a>
          )}

                          {/* External links - show appropriate link based on item type */}
                {itemType === 'universities' && item.website ? (
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="item-link website-link"
                    title="Visit official website"
                  >
                    <MapPin size={16} />
                    <span>Website</span>
                  </a>
                ) : itemType === 'highSchools' && item.website ? (
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="item-link website-link"
                    title="Visit school website"
                  >
                    <MapPin size={16} />
                    <span>Website</span>
                  </a>
                ) : itemType === 'highSchools' && item.externalUrl ? (
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="item-link infos-link"
                    title="View official information"
                  >
                    <MapPin size={16} />
                    <span>Infos gouv.fr</span>
                  </a>
                ) : item.externalUrl && (
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                                                  className={`item-link ${(itemType === 'highSchools' || itemType === 'internationalHighSchools') ? 'infos-link' : 'osm-link'}`}
                              title={(itemType === 'highSchools' || itemType === 'internationalHighSchools') ? 'View official information' : 'View on OpenStreetMap'}
                  >
                    <MapPin size={16} />
                                          <span>{(itemType === 'highSchools' || itemType === 'internationalHighSchools') ? 'Infos gouv.fr' : 'OpenStreetMap'}</span>
                  </a>
                )}

          {/* Address/Map link */}
          {item.address && (
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(item.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="item-link map-link"
            >
              <MapPin size={16} />
              <span>Open map</span>
            </a>
          )}

          {/* Trail information */}
          <div className="trail-info">
            {item.length && (
              <span className="item-length">
                Length: {formatMetric('geography', 'hikeLength', item.length)}
              </span>
            )}
            {item.difficulty && (
              <span className="item-difficulty">Difficulty: {item.difficulty}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className={`info-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3 className="drawer-title">{title}</h3>
          <button className="drawer-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="drawer-content">
          {items && items.length > 0 ? (
            <>
              {/* Inline map at the top - hide for hikes since most are relations */}
              {itemType !== 'hikes' ? (
                <div className="map-container">
                  {(() => {
                    // Calculate map center and bounds based on actual item coordinates
                    const itemsWithCoords = sortedItems.filter(item => item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length === 2);

                    if (itemsWithCoords.length === 0) {
                      return (
                        <div className="no-map-data">
                          <p>No location data available for these places.</p>
                        </div>
                      );
                    }

                    let mapCenter = [43.5297, 5.4474]; // Default to Aix-en-Provence
                    let mapZoom = 12;

                    // Calculate center based on actual coordinates
                    const lats = itemsWithCoords.map(item => item.coordinates[0]);
                    const lngs = itemsWithCoords.map(item => item.coordinates[1]);
                    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
                    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
                    mapCenter = [centerLat, centerLng];

                    // Adjust zoom based on coordinate spread
                    const latSpread = Math.max(...lats) - Math.min(...lats);
                    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
                    const maxSpread = Math.max(latSpread, lngSpread);

                    if (maxSpread < 0.01) mapZoom = 15;      // Very close items
                    else if (maxSpread < 0.05) mapZoom = 13; // Close items
                    else if (maxSpread < 0.1) mapZoom = 12;  // Medium spread
                    else mapZoom = 11;                        // Wide spread

                    return (
                      <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        style={{ height: '300px', width: '100%' }}
                        ref={mapRef}
                        // Ensure all markers are visible by setting bounds
                        bounds={[
                          [Math.min(...lats), Math.min(...lngs)],
                          [Math.max(...lats), Math.max(...lngs)]
                        ]}
                        boundsOptions={{ padding: [20, 20] }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {/* Render markers for all items */}
                        {itemsWithCoords.map((item, index) => (
                          <Marker key={`${item.externalId || index}`} position={item.coordinates}>
                            <Popup>
                              <strong>{item.name}</strong><br />
                              {item.description && <>{item.description}<br /></>}
                              {item.length && (
                                `Length: ${formatMetric('geography', 'hikeLength', item.length)}`
                              )}
                              {item.difficulty && <><br />Difficulty: {item.difficulty}</>}
                              {(itemType === 'universities' && item.website) ? (
                                <>
                                  <br />
                                  <a
                                    href={item.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Website
                                  </a>
                                </>
                              ) : ((itemType === 'highSchools' || itemType === 'internationalHighSchools') && item.website && item.externalUrl) ? (
                                <>
                                  <br />
                                  <a
                                    href={item.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Website
                                  </a>
                                  <br />
                                  <a
                                    href={item.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Infos gouv.fr
                                  </a>
                                </>
                              ) : ((itemType === 'highSchools' || itemType === 'internationalHighSchools') && item.website) ? (
                                <>
                                  <br />
                                  <a
                                    href={item.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Website
                                  </a>
                                </>
                              ) : ((itemType === 'highSchools' || itemType === 'internationalHighSchools') && item.externalUrl) ? (
                                <>
                                  <br />
                                  <a
                                    href={item.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Infos gouv.fr
                                  </a>
                                </>
                              ) : item.externalUrl && (
                                <>
                                  <br />
                                  <a
                                    href={item.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    View details
                                  </a>
                                </>
                              )}
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    );
                  })()}
                </div>
              ) : (
                <div className="hikes-summary">
                  <div className="hikes-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Hiking Trails:</span>
                      <span className="stat-value">{items.length}</span>
                    </div>
                    {items.length > 0 && items[0].length && (
                      <div className="stat-item">
                        <span className="stat-label">Total Length:</span>
                        <span className="stat-value">{formatMetric('geography', 'hikesTotalLength', items.reduce((total, hike) => total + (hike.length || 0), 0))}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="items-list">
                {sortedItems.map((item, index) => renderItem(item, index))}
              </div>
            </>
          ) : (
            <div className="no-items">
              <p>No {itemType} information available.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InfoDrawer;
