import { updateCityWeather } from './data-sources/open-meteo-weather.js';

// Test with Lyon and Oakland to compare results
const cities = [
  { name: 'Lyon', coords: [45.7578, 4.832] },
  { name: 'Oakland', coords: [37.8044, -122.2711] }
];

console.log('🧪 Testing weather data for multiple cities...\n');

async function testCities() {
  for (const city of cities) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🧪 Testing ${city.name}...`);
    console.log(`${'='.repeat(50)}`);

    const result = await updateCityWeather(city.name, city.coords);
    if (result) {
      console.log(`\n🎯 ${city.name} result:`, {
        sunnyDays: result.sunnyDays,
        rainyDays: result.rainyDays,
        avgTemp: result.avgTemp
      });
    }

    console.log('\n');
  }
}

testCities()
  .then(() => {
    console.log('✅ All tests completed');
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
