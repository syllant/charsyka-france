# Data Sources

This directory contains data source scripts for populating city information from various APIs and services.

## Weather Data

### Visual Crossing Weather API (`visual-crossing-weather.js`)

**Purpose**: Fetches real monthly historical weather data for cities
**Data**: Monthly temperatures, precipitation, and calculated sunny/rainy days
**Coverage**: Global coverage with historical data going back years

**Features**:
- ✅ **Real monthly data** - No estimation or fake data
- ✅ **Historical patterns** - Actual seasonal temperature variations
- ✅ **Accurate precipitation** - Real monthly rainfall patterns
- ✅ **Global coverage** - Works for any city worldwide

**Setup**:
1. Get free API key from [Visual Crossing Weather API](https://www.visualcrossing.com/weather-api)
2. Set environment variable: `export VISUAL_CROSSING_API_KEY=your_api_key`
3. Run: `npm run update-weather`

**Data Quality**:
- Provides 365+ days of historical weather data
- Real monthly temperature patterns (winter cold, summer hot)
- Real monthly precipitation patterns (winter wet, summer dry)
- No hardcoded values or climate zone assumptions

## Education Data

### French Ministry of Education (`fr-education-highschools.js`)
**Purpose**: Fetches high school data from French government sources
**Data**: High school names, addresses, coordinates, ratings

### French Ministry of Higher Education (`fr-esr-universities.js`)
**Purpose**: Fetches university data from French government sources
**Data**: University names, addresses, coordinates, types

### International High Schools (`fr-education-international-highschools.js`)
**Purpose**: Fetches international high school data
**Data**: School names, addresses, coordinates, ratings

## Cultural Data

### French Ministry of Culture (`fr-culture-places.js`)
**Purpose**: Fetches cultural venue data from French government sources
**Data**: Museums, theaters, cinemas, operas with addresses and coordinates

## Geographic Data

### OpenStreetMap Hikes (`osm-hikes.js`)
**Purpose**: Fetches hiking trail data from OpenStreetMap
**Data**: Trail names, descriptions, coordinates, lengths, difficulties

### OpenStreetMap Places (`osm-places.js`)
**Purpose**: Fetches general place data from OpenStreetMap
**Data**: Place names, addresses, coordinates, types

## Usage

All data sources follow the same pattern:
1. **Fetch data** from external APIs/services
2. **Process and validate** the data
3. **Update city JSON files** with new information
4. **Maintain data source attribution** in schema and city files

## Data Source Attribution

Each data source is properly attributed in:
- **Schema**: `src/data/schema.json` - defines data structure and sources
- **City files**: `src/data/*.json` - includes `dataSource` and `lastUpdated` fields
- **Metrics config**: `src/config/metrics.js` - includes source URLs for webapp display
