# Initial Requirements
Here are the requirements for building this webapp.

## General goal
Aims to help a French/American family living in California and coming back to France in summer 2026. They need to decide in which city and want a support, implemented as a webapp, to compare a set of dimensions. They will also visit these cities at Christmas 2025, so the webapp will also help for the roadtrip.

## List of cities
Consider:
* Aix-en-Provence
* Bordeaux
* Marseille
* Montpellier
* Nantes

Also, consider Lyon and Oakland (CA, USA) as reference points

## Dimensions
Here are some dimensions to compare:

* Weather/Climate
   * # of sunny days
   * # of rainy days
   * temperature
* Population
   * Total
   * Percentage of students (choose a threshold according to what you find) - higher is better
   * Density - lower is better
* Education
   * # of high-schools
   * # of universities
   * # of international high-schools
* Culture
  * # of museums
  * # of movie theaters
  * # of theaters/operas
  * # of cultural events per year
* Transportation
  * # of foreign cities accessible with direct international flights
  * distance to Paris by car and train
  * distance to Lyon by car and train
  * general transit score
* Geography/Location
  * distance to the closest sea/ocean beach
  * distance to the closest ski station
  * # and total length of hikes per AllTrails
* Housing
  * Average sell price for houses
  * Average rental price for houses
* Quality of Life
  * Crime rate
  * Density of green spaces
  * Air quality
  * Cost of life
  * General liveability score
  * Quality of health

Feel free to add more.

## Presentation

### General navigation
I imagine a home page with:
* a simplified map of France with all the compared cities
* a table view comparing the cities (as columns) for all dimensions (as rows)

And a detailed page when users click on a city

### Table view
* Ensure all cities are visible in the width, without scrolling
* Use colors/styles to show the best/worst in each dimension, e.g. using a gradient green to red

### Detailed view
* Show a map of the city with the different neighborhoods
* Display each of the dimension from the comparison, but giving more information when possible
   * e.g. for weather data, show a graph over the months of the year
* Show the position of the city for each dimension (e.g. "3 on 5", or anything more visual indicating the position)
* Show a gallery of pictures illustrating the main / most popular attractions/places of the city

## Other
* Be creative and build something easy/quick to assess at a glance, focused on comparing the cities on the different dimensions.
