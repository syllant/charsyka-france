const fs = require('fs');
const path = require('path');

// Pexels API configuration
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_API_BASE = 'https://api.pexels.com/v1';

// City search terms - specific city names with country to distinguish them
const citySearchTerms = {
  'aix-en-provence': ['aix en provence city france'],
  'bordeaux': ['bordeaux city france'],
  'lyon': ['lyon city france'],
  'marseille': ['marseille city france'],
  'montpellier': ['montpellier city france'],
  'nantes': ['nantes city france'],
  'oakland': ['oakland city california']
};

async function searchPexelsPhotos(query, orientation = 'landscape', perPage = 100) {
  if (!PEXELS_API_KEY) {
    throw new Error('PEXELS_API_KEY environment variable is not set');
  }

  try {
    const searchUrl = `${PEXELS_API_BASE}/search?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=${perPage}`;

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.photos || [];
  } catch (error) {
    console.error(`Error searching Pexels for "${query}":`, error.message);
    return [];
  }
}

async function getCityImages(cityId, cityName) {
  console.log(`\nFetching images for ${cityName}...`);

  const searchTerm = citySearchTerms[cityId][0]; // Use the single, specific search term
  console.log(`Searching for: "${searchTerm}"`);

  // Get photos with the specific city search term
  const photos = await searchPexelsPhotos(searchTerm, 'landscape', 100);

  // Select one banner image (landscape) and up to 100 gallery images
  const bannerImage = photos[0]; // First image for banner
  const galleryImages = photos.slice(1, 101); // Up to 100 for gallery

  const images = [
    // Banner image - landscape format
    {
      url: `${bannerImage.src.original}?w=1200&h=400&fit=crop&crop=center`,
      alt: bannerImage.alt || `${cityName} cityscape`,
      photographer: bannerImage.photographer || 'Unknown',
      isBanner: true
    },
    // Gallery images - store original URLs for full-size display
    ...galleryImages.map(photo => ({
      url: photo.src.original, // No size constraints for full-size modal display
      alt: photo.alt || `${cityName} attraction`,
      photographer: photo.photographer || 'Unknown',
      isBanner: false
    }))
  ];

  console.log(`Found ${images.length} images for ${cityName}:`);
  console.log(`  Banner: ${bannerImage.alt || 'No description'}`);
  console.log(`  Gallery: ${galleryImages.length} images`);

  return images;
}

async function updateAllCities() {
  const dataDir = path.join(__dirname, '../../src/data');
  const cities = Object.keys(citySearchTerms);

  console.log('Starting Pexels image update for all cities...');
  console.log(`API Key: ${PEXELS_API_KEY ? '✓ Set' : '✗ Missing'}`);

  for (const cityId of cities) {
    try {
      const cityName = cityId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const images = await getCityImages(cityId, cityName);

      if (images.length > 0) {
        // Update city data file
        const cityFilePath = path.join(dataDir, `${cityId}.json`);
        const cityData = JSON.parse(fs.readFileSync(cityFilePath, 'utf8'));

        cityData.images = images;
        cityData.dataQuality.sources.images = 'Pexels API';
        cityData.dataQuality.lastUpdated = new Date().toISOString().split('T')[0];

        fs.writeFileSync(cityFilePath, JSON.stringify(cityData, null, 2));
        console.log(`✅ Updated ${cityId} with ${images.length} images`);
      } else {
        console.log(`❌ No images found for ${cityId}`);
      }

      // Add delay between cities to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`Error updating ${cityId}:`, error.message);
    }
  }

  console.log('\n🎉 Pexels image update completed!');
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateAllCities().catch(console.error);
}

module.exports = {
  searchPexelsPhotos,
  getCityImages,
  updateAllCities
};
