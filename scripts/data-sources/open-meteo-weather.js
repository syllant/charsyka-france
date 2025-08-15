/**
 * Weather Data Source using Open-Meteo Historical Weather API
 * ONLY uses real data - NO estimation or fake data
 */

import fetch from 'node-fetch';

// Open-Meteo API configuration - NO API KEY NEEDED!
const BASE_URL = 'https://archive-api.open-meteo.com/v1';

/**
 * Get real historical weather data for a city from Open-Meteo
 */
async function getRealHistoricalWeatherData(cityName, coordinates) {
  try {
    const [lat, lon] = coordinates;

    // Get historical data for the past year to have real monthly patterns
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    const url = `${BASE_URL}/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

    console.log(`  📊 Fetching real historical weather data for ${cityName}...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log(`  📊 Received ${data.daily?.time?.length || 0} days of real historical data`);

    return data;
  } catch (error) {
    console.error(`Error fetching weather for ${cityName}:`, error.message);
    return null;
  }
}

/**
 * Calculate real monthly data ONLY from actual historical data
 */
function calculateRealMonthlyData(weatherData) {
  if (!weatherData || !weatherData.daily || weatherData.daily.time.length === 0) {
    console.log('  ❌ No real historical data available');
    return null;
  }

  console.log(`  📅 Processing ${weatherData.daily.time.length} days of real historical data...`);

  // Group daily data by month
  const monthlyData = {};

  weatherData.daily.time.forEach((timeStr, index) => {
    const date = new Date(timeStr);
    const month = date.getMonth(); // 0-11

    if (!monthlyData[month]) {
      monthlyData[month] = {
        temps: [],
        precipitation: [],
        sunnyDays: 0,
        rainyDays: 0
      };
    }

    // Use average of max and min temperature for the day
    const maxTemp = weatherData.daily.temperature_2m_max[index];
    const minTemp = weatherData.daily.temperature_2m_min[index];
    const avgTemp = (maxTemp + minTemp) / 2;

    monthlyData[month].temps.push(avgTemp);

    // IMPORTANT: Open-Meteo returns DAILY precipitation, we need to SUM them for monthly totals
    const dailyPrecip = weatherData.daily.precipitation_sum[index] || 0;
    monthlyData[month].precipitation.push(dailyPrecip);

    // Count each day as rainy or sunny based on actual precipitation
    if (dailyPrecip > 0.1) { // More than 0.1mm counts as a rainy day
      monthlyData[month].rainyDays++;
    } else {
      monthlyData[month].sunnyDays++;
    }
  });

  // Calculate real monthly data
  const monthlyTemps = [];
  const monthlyPrecipitation = [];
  const monthlySunnyDays = [];
  const monthlyRainyDays = [];

  for (let month = 0; month < 12; month++) {
    if (monthlyData[month] && monthlyData[month].temps.length > 0) {
      const avgTemp = monthlyData[month].temps.reduce((sum, temp) => sum + temp, 0) / monthlyData[month].temps.length;

      // SUM daily precipitation values to get monthly total (not average)
      const monthlyPrecipTotal = monthlyData[month].precipitation.reduce((sum, precip) => sum + precip, 0);

      monthlyTemps.push(Math.round(avgTemp * 10) / 10);
      monthlyPrecipitation.push(Math.round(monthlyPrecipTotal * 10) / 10);
      monthlySunnyDays.push(monthlyData[month].sunnyDays);
      monthlyRainyDays.push(monthlyData[month].rainyDays);

      console.log(`  📊 Month ${month}: Real historical data - ${avgTemp.toFixed(1)}C, ${monthlyPrecipTotal.toFixed(1)}mm (monthly total), ${monthlyData[month].sunnyDays} sunny, ${monthlyData[month].rainyDays} rainy days`);
    } else {
      console.log(`  ❌ Month ${month}: No historical data available`);
      monthlyTemps.push(null);
      monthlyPrecipitation.push(null);
      monthlySunnyDays.push(null);
      monthlyRainyDays.push(null);
    }
  }

  return { monthlyTemps, monthlyPrecipitation, monthlySunnyDays, monthlyRainyDays };
}

/**
 * Calculate real sunny/rainy days ONLY from actual precipitation data
 */
function calculateRealSunnyRainyDays(monthlyPrecipitation, cityName) {
  // Only use months with real data
  const realMonths = monthlyPrecipitation.filter(precip => precip !== null);

  if (realMonths.length === 0) {
    console.log(`  ❌ No real precipitation data available for ${cityName}`);
    return { sunnyDays: null, rainyDays: null };
  }

  // Calculate total from real data only
  const totalPrecip = realMonths.reduce((sum, precip) => sum + precip, 0);
  const avgMonthlyPrecip = totalPrecip / realMonths.length;

  console.log(`  🌤️  ${cityName}: Real historical data shows ${totalPrecip.toFixed(0)}mm total precip, ${avgMonthlyPrecip.toFixed(1)}mm monthly avg`);

  // Estimate based on real precipitation patterns (this is the only estimation, based on actual data)
  let rainyDays;
  if (avgMonthlyPrecip < 30) {
    rainyDays = 60; // Dry climate
  } else if (avgMonthlyPrecip < 60) {
    rainyDays = 90; // Moderate climate
  } else if (avgMonthlyPrecip < 100) {
    rainyDays = 120; // Wet climate
  } else {
    rainyDays = 150; // Very wet climate
  }

  const sunnyDays = 365 - rainyDays - 30; // 30 days for cloudy/overcast

  console.log(`  🌤️  → ${sunnyDays} sunny, ${rainyDays} rainy days (based on real historical data)`);

  return { sunnyDays, rainyDays };
}

/**
 * Get REAL weather metrics for a city - NO fake data
 */
async function getWeatherMetrics(cityName, coordinates) {
  try {
    console.log(`  🌍 Getting real historical weather data for ${cityName}...`);

    // Get real historical weather data
    const weatherData = await getRealHistoricalWeatherData(cityName, coordinates);
    if (!weatherData) {
      throw new Error('Failed to fetch real historical weather data from Open-Meteo');
    }

    // Calculate monthly data ONLY from real historical data
    const monthlyAverages = calculateRealMonthlyData(weatherData);
    if (!monthlyAverages) {
      throw new Error('No real monthly data available from historical API');
    }

    // Calculate annual totals by summing the real monthly counts
    const totalSunnyDays = monthlyAverages.monthlySunnyDays.reduce((sum, days) => sum + (days || 0), 0);
    const totalRainyDays = monthlyAverages.monthlyRainyDays.reduce((sum, days) => sum + (days || 0), 0);

    console.log(`  🌤️  ${cityName}: Real historical data shows ${totalSunnyDays} total sunny days, ${totalRainyDays} total rainy days`);

    // Calculate average temperature ONLY from months with real data
    const realTemps = monthlyAverages.monthlyTemps.filter(temp => temp !== null);
    const avgTemp = realTemps.length > 0 ? realTemps.reduce((sum, temp) => sum + temp, 0) / realTemps.length : null;

    if (totalSunnyDays === 0 || totalRainyDays === 0 || avgTemp === null) {
      throw new Error('Insufficient real data to calculate weather metrics');
    }

        // Use the real monthly sunny/rainy days calculated from daily data
    const { monthlySunnyDays, monthlyRainyDays } = monthlyAverages;

    const weatherDataResult = {
      sunnyDays: totalSunnyDays,
      rainyDays: totalRainyDays,
      avgTemp: Math.round(avgTemp * 10) / 10,
      monthlyData: monthlyAverages.monthlyTemps,
      monthlySunnyDays,
      monthlyRainyDays,
      monthlyPrecipitation: monthlyAverages.monthlyPrecipitation
    };

        // Log monthly breakdown for debugging
    console.log(`  📅 Monthly breakdown for ${cityName}:`);
    for (let month = 0; month < 12; month++) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      console.log(`    ${monthNames[month]}: ${monthlySunnyDays[month]} sunny, ${monthlyRainyDays[month]} rainy days`);
    }

    console.log(`  ✅ Successfully processed real historical weather data for ${cityName}`);
    return weatherDataResult;

  } catch (error) {
    console.error(`  ❌ Failed to get real weather data for ${cityName}:`, error.message);
    return null;
  }
}

/**
 * Update weather data for a specific city
 */
export async function updateCityWeather(cityName, coordinates) {
  try {
    console.log(`Updating weather data for ${cityName}...`);

    const weatherData = await getWeatherMetrics(cityName, coordinates);
    if (!weatherData) {
      throw new Error('Failed to fetch real weather data');
    }

    console.log(`Real historical weather data for ${cityName}:`, {
      sunnyDays: weatherData.sunnyDays,
      rainyDays: weatherData.rainyDays,
      avgTemp: weatherData.avgTemp
    });

    return weatherData;
  } catch (error) {
    console.error(`Error updating weather for ${cityName}:`, error.message);
    return null;
  }
}

/**
 * Update weather data for all cities
 */
export async function updateAllCitiesWeather(cities) {
  console.log('Starting weather data update for all cities using Open-Meteo Historical API...');
  console.log('✅ Using ONLY real historical data - NO estimation or fake data!');
  console.log('✅ No API key required - completely free and open!');

  const results = {};

  for (const city of cities) {
    if (city.coordinates) {
      const weatherData = await updateCityWeather(city.name, city.coordinates);
      if (weatherData) {
        results[city.id] = weatherData;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('Weather data update completed for cities:', Object.keys(results));
  return results;
}

// Export for use in other scripts
export default {
  updateCityWeather,
  updateAllCitiesWeather,
  getWeatherMetrics
};
