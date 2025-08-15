// Comprehensive test script for all updated metric formatting
const { formatMetric, formatMetricValue } = require('./src/utils/metricFormatters.js');

console.log('🧪 Testing All Updated Metric Formatting\n');

// Test population formatting (compact, no unit)
console.log('📊 Population Formatting:');
console.log('Population total:', formatMetric('population', 'total', 515000));
console.log('Population total:', formatMetric('population', 'total', 1200000));
console.log('Student percentage:', formatMetric('population', 'studentPercentage', 23));
console.log('Density:', formatMetric('population', 'density', 1500));

// Test weather formatting (no units for sunny/rainy days)
console.log('\n🌤️ Weather Formatting:');
console.log('Sunny days:', formatMetric('weather', 'sunnyDays', 250));
console.log('Rainy days:', formatMetric('weather', 'rainyDays', 100));
console.log('Avg temp:', formatMetric('weather', 'avgTemp', 13.8));

// Test transportation formatting (transit score with one decimal)
console.log('\n🚌 Transportation Formatting:');
console.log('Transit score:', formatMetric('transportation', 'transitScore', 8));
console.log('Transit score:', formatMetric('transportation', 'transitScore', 7.5));

// Test housing formatting (€/m² for both, no spaces)
console.log('\n🏠 Housing Formatting:');
console.log('House price:', formatMetric('housing', 'avgSellPricePerM2', 6154));
console.log('Rent price:', formatMetric('housing', 'avgRentPricePerM2', 17));

// Test quality of life formatting (no units for scores)
console.log('\n❤️ Quality of Life Formatting:');
console.log('Crime rate:', formatMetric('qualityOfLife', 'crimeRate', 2.9));
console.log('Green spaces:', formatMetric('qualityOfLife', 'greenSpaces', 7.8));
console.log('Air quality:', formatMetric('qualityOfLife', 'airQuality', 7.5));
console.log('Cost of life:', formatMetric('qualityOfLife', 'costOfLife', 7.5));
console.log('Liveability:', formatMetric('qualityOfLife', 'liveabilityScore', 8.1));
console.log('Health quality:', formatMetric('qualityOfLife', 'healthQuality', 8.1));

console.log('\n✅ All formatting tests completed!');
