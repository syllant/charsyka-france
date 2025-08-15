import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useCities } from '../context/CityContext';
import ComparisonTable from './ComparisonTable';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const HomePage = () => {
  const { cities } = useCities();
  const navigate = useNavigate();

  // All cities are now treated equally
  const allCities = cities;

  const handleCityClick = (cityId) => {
    navigate(`/city/${cityId}`);
  };

  return (
    <div className="home-page">
      <section className="map-section">
        <div className="map-container">
          <MapContainer
            center={[46.603354, 1.888334]}
            zoom={5}
            style={{ height: '500px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {allCities.map((city) => (
              <Marker
                key={city.id}
                position={city.coordinates}
                eventHandlers={{
                  click: () => handleCityClick(city.id),
                }}
              >
                <Popup>
                  <div>
                    <h3>{city.name}</h3>
                    <p>{city.region}</p>
                    <button onClick={() => handleCityClick(city.id)}>
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

      </section>

      <section className="comparison-section">
        <ComparisonTable />
      </section>
    </div>
  );
};

export default HomePage;
