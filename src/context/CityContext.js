import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllCities } from '../data';

const CityContext = createContext();

export const useCities = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCities must be used within a CityProvider');
  }
  return context;
};

export const CityProvider = ({ children }) => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const allCitiesData = await getAllCities();
        setCities(allCitiesData);
      } catch (error) {
        console.error('Error loading cities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCities();
  }, []);

  const value = {
    cities,
    loading,
    getCityById: (id) => cities.find(city => city.id === id)
  };

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
};
