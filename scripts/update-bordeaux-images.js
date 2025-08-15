const fs = require('fs');
const path = require('path');

// Bordeaux-specific images with different URLs for variety
const bordeauxImages = [
  // Banner image - landscape architecture shot
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop&crop=center',

  // Gallery images - different photos
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600&fit=crop'
];

const dataDir = path.join(__dirname, '../src/data');
const filePath = path.join(dataDir, 'bordeaux.json');

try {
  const cityData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Update images
  cityData.images = bordeauxImages;
  console.log(`Updated ${cityData.images.length} images for Bordeaux`);
  console.log('Banner image (landscape):', cityData.images[0]);
  console.log('Gallery images:', cityData.images.slice(1));

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(cityData, null, 2));
  console.log('Bordeaux images updated successfully!');

} catch (error) {
  console.error('Error updating Bordeaux images:', error.message);
}
