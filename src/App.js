import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import CityDetailPage from './components/CityDetailPage';
import { CityProvider } from './context/CityContext';

function App() {
  return (
    <CityProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/city/:cityId" element={<CityDetailPage />} />
          </Routes>
        </div>
      </Router>
    </CityProvider>
  );
}

export default App;
