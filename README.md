# Charsyka France - City Comparison Webapp

A comprehensive web application designed to help French/American families compare different French cities for relocation decisions. Built with React, this webapp provides detailed comparisons across multiple dimensions including weather, education, culture, transportation, and quality of life.

## Features

### 🗺️ Interactive Map
- Interactive map of France showing all compared cities
- Click on city markers to view details
- Responsive design with OpenStreetMap integration

### 📊 Comprehensive Comparison Table
- Side-by-side comparison of all cities
- Color-coded values (green to red) indicating performance
- Covers all major dimensions:
  - **Weather & Climate**: Sunny days, rainy days, temperature
  - **Population**: Total population, student percentage, density
  - **Education**: High schools, international high schools, universities
  - **Culture**: Museums, theaters, cultural events
  - **Transportation**: International flights, transit scores, distances
  - **Geography**: Beach proximity, ski access, hiking trails
  - **Housing**: Average prices and rental costs
  - **Quality of Life**: Crime rates, green spaces, air quality

### 🏙️ Detailed City Pages
- Individual city detail pages with comprehensive information
- Interactive charts for weather data
- City maps with neighborhood information
- Photo galleries of city attractions
- Position indicators showing city ranking in each dimension

## Cities Included

- **Aix-en-Provence** - Provence-Alpes-Côte d'Azur
- **Bordeaux** - Nouvelle-Aquitaine
- **Marseille** - Provence-Alpes-Côte d'Azur
- **Montpellier** - Occitanie
- **Nantes** - Pays de la Loire

## Technology Stack

- **Frontend**: React 18 with React Router
- **Maps**: Leaflet with React-Leaflet
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for modern iconography
- **Styling**: Custom CSS with responsive design
- **Data**: Context API for state management

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd charsyka-france
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp env.example .env

# Edit .env and add your API keys
# PEXELS_API_KEY=your_actual_pexels_api_key_here
```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── HomePage.js          # Main page with map and comparison table
│   ├── CityDetailPage.js    # Individual city detail pages
│   └── ComparisonTable.js   # Comparison table component
├── context/
│   └── CityContext.js       # City data and context management
├── App.js                   # Main app component with routing
└── App.css                  # Comprehensive styling
```

## Data Structure

Each city includes comprehensive data across multiple dimensions:

```javascript
{
  id: 'city-id',
  name: 'City Name',
  region: 'Region Name',
  coordinates: [lat, lng],
  weather: { sunnyDays, rainyDays, avgTemp, monthlyData },
  population: { total, studentPercentage, density },
  education: { highSchools, internationalHighSchools, universities },
  culture: { museums, cinemas, theaters, operas, culturalEvents },
  transportation: { internationalFlights, distanceToParis, distanceToLyon, transitScore },
  geography: { hikes },
  housing: { avgSellPrice, avgRentPrice },
  qualityOfLife: { crimeRate, greenSpaces, airQuality, costOfLife, liveabilityScore, healthQuality },
  images: [imageUrls]
}
```

## Usage

### Home Page
- View the interactive map of France
- See all cities marked with clickable markers
- Access the comprehensive comparison table
- Click on city names in the table to view detailed information

### City Detail Pages
- Navigate through detailed information for each dimension
- View interactive weather charts
- See city positioning in rankings
- Explore photo galleries of attractions
- Use the back button to return to the comparison

### Comparison Table
- Scroll horizontally to see all cities
- Use color coding to quickly identify best/worst performers
- Click on city names to navigate to detail pages
- Reference the legend for color meanings

## Design Principles

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Color Coding**: Intuitive green-to-red gradient for performance indicators
- **Interactive Elements**: Hover effects, smooth transitions, and engaging user experience
- **Accessibility**: Clear navigation, readable fonts, and logical information hierarchy
- **Performance**: Optimized rendering and efficient data management

## Future Enhancements

- Real-time data integration with external APIs
- User preferences and custom city lists
- Advanced filtering and sorting options
- Export functionality for comparison data
- Multi-language support
- User reviews and ratings
- Cost of living calculators
- School district information

## Contributing

This project is designed to help families make informed decisions about relocation. Contributions are welcome to improve data accuracy, add new cities, or enhance the user experience.

## License

This project is built for educational and personal use to assist with relocation decisions.

---

Built with ❤️ to help families find their perfect French city!
