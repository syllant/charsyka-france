# Scripts Documentation

## Overview

This directory contains scripts for populating and updating city data from various sources. The system is designed to be modular, allowing easy addition of new data sources.

## Scripts

### Main Scripts

#### `update-city.js` (Recommended)
**Main entry point** for updating city data from all sources.

```bash
# Update all cities
npm run update-city

# Update specific city
npm run update-city "Aix-en-Provence"
```

This script coordinates updates from multiple data sources:
- OpenStreetMap (places)
- AllTrails (hikes)
- Future sources (weather, demographics, etc.)

#### `populate-city-places.js` (Legacy)
Legacy script for populating places only. Use `update-city.js` instead.

### Data Source Modules

#### `data-sources/places.js`
Fetches place data from OpenStreetMap and Wikidata:
- High schools, universities, museums, theaters
- Movie theaters, international high schools
# Beaches and ski resorts removed
- Automatically fetches websites from Wikidata when not available in OSM

#### `data-sources/hikes.js`
Fetches hiking trail data from AllTrails:
- Trail names, descriptions, lengths
- Difficulty levels, ratings
- AllTrails URLs and IDs
- **Note**: Currently uses mock data - AllTrails API integration needed

## Architecture

```
update-city.js (Main Coordinator)
├── data-sources/places.js (OpenStreetMap + Wikidata)
├── data-sources/hikes.js (AllTrails)
└── Future modules (weather, demographics, etc.)
```

## Adding New Data Sources

1. Create a new module in `data-sources/`
2. Export an `updateCity[SourceName]` function
3. Import and call it in `update-city.js`
4. Update the schema if needed

Example:
```javascript
// data-sources/weather.js
async function updateCityWeather(cityName) {
  // Fetch weather data
}

module.exports = { updateCityWeather };

// update-city.js
const { updateCityWeather } = require('./data-sources/weather.js');
// ... in updateCity function
await updateCityWeather(cityName);
```

## Data Structure

### Places
```json
{
  "name": "Place Name",
  "address": "Full address",
  "coordinates": [lat, lng],
  "website": "https://...",
  "osmId": "12345",
  "category": "high school"
}
```

### Hikes
```json
{
  "name": "Trail Name",
  "description": "Trail description",
  "length": 12.5,
  "difficulty": "Moderate",
  "rating": 4.7,
  "allTrailsId": "trail-id",
  "allTrailsUrl": "https://www.alltrails.com/...",
  "coordinates": [lat, lng]
}
```

## Rate Limiting

- **Nominatim (OpenStreetMap)**: 1 request/second
- **Wikidata**: 500ms between requests
- **AllTrails**: 2 seconds between requests (mock)

## Future Enhancements

- [ ] Real AllTrails API integration
- [ ] Weather data integration
- [ ] Demographic data integration
- [ ] Real-time data updates
- [ ] Data validation and quality checks
