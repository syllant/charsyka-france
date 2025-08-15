/**
 * Centralized metric configuration
 * This file serves as the single source of truth for all metric definitions,
 * ensuring consistency between table view, details view, and other components.
 */

import {
  Sun, CloudRain, Thermometer, Users, GraduationCap, BookOpen,
  Theater, Film, Music, Train, Car, Plane, Mountain, Home,
  Shield, Leaf, Wind, DollarSign, Star, Heart
} from 'lucide-react';

export const METRIC_CONFIG = {
  weather: {
    title: 'Weather',
    metrics: {
      sunnyDays: {
        label: 'Sunny Days',
        icon: Sun,
        tooltip: 'Number of sunny days annually',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://open-meteo.com/',
        unit: '',
        format: 'integer',
        precision: 0
      },
      rainyDays: {
        label: 'Rainy Days',
        icon: CloudRain,
        tooltip: 'Number of rainy days annually',
        type: 'number',
        higherBetter: false,
        sourceUrl: 'https://open-meteo.com/',
        unit: '',
        format: 'integer',
        precision: 0
      },
      avgTemp: {
        label: 'Avg Temperature',
        icon: Thermometer,
        tooltip: 'Average annual temperature in Celsius',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://open-meteo.com/',
        unit: '°C',
        format: 'decimal',
        precision: 1
      }
    }
  },
  population: {
    title: 'Population',
    metrics: {
      total: {
        label: 'Population',
        icon: Users,
        tooltip: 'Total population',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.insee.fr/',
        unit: '',
        format: 'compact',
        precision: 0
      },
      studentPercentage: {
        label: 'Student %',
        icon: GraduationCap,
        tooltip: 'Percentage of students in population',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.insee.fr/',
        unit: '%',
        format: 'integer',
        precision: 0
      },
      density: {
        label: 'Density',
        icon: Users,
        tooltip: 'Population density per km²',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.insee.fr/',
        unit: '/km²',
        format: 'integer',
        precision: 0
      }
    }
  },
  education: {
    title: 'Education',
    metrics: {
      highSchools: {
        label: 'High Schools',
        icon: GraduationCap,
        tooltip: 'Number of high schools',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.education.gouv.fr/',
        unit: '',
        format: 'integer',
        precision: 0
      },
      universities: {
        label: 'Universities',
        icon: GraduationCap,
        tooltip: 'Number of universities',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.education.gouv.fr/',
        unit: '',
        format: 'integer',
        precision: 0
      },
      internationalHighSchools: {
        label: 'International Schools',
        icon: GraduationCap,
        tooltip: 'Number of international high schools',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.education.gouv.fr/',
        unit: '',
        format: 'integer',
        precision: 0
      }
    }
  },
  culture: {
    title: 'Culture',
    metrics: {
      museums: {
        label: 'Museums',
        icon: BookOpen,
        tooltip: 'Number of museums',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.culture.gouv.fr/',
        unit: '',
        format: 'integer',
        precision: 0
      },
      theaters: {
        label: 'Theaters',
        icon: Theater,
        tooltip: 'Number of theaters',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.culture.gouv.fr/',
        unit: '',
        format: 'integer',
        precision: 0
      },
      cinemas: {
        label: 'Cinemas',
        icon: Film,
        tooltip: 'Number of cinemas',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.culture.gouv.fr/',
        unit: '',
        format: 'integer',
        precision: 0
      },
      operas: {
        label: 'Operas',
        icon: Music,
        tooltip: 'Number of opera houses',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.culture.gouv.fr/',
        unit: '',
        format: 'integer',
        precision: 0
      }
    }
  },
  transportation: {
    title: 'Transportation',
    metrics: {
      internationalFlights: {
        label: 'Int\'l Flights',
        icon: Plane,
        tooltip: 'Number of cities with direct international flights',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.aviation-civile.gouv.fr/',
        unit: '',
        format: 'integer',
        precision: 0
      },
      transitScore: {
        label: 'Transit Score',
        icon: Train,
        tooltip: 'Public transportation quality score (1-10)',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.transport.gouv.fr/',
        unit: '',
        format: 'decimal',
        precision: 1
      },
      distanceToParisWithCar: {
        label: 'Time to Paris (Car)',
        icon: Car,
        tooltip: 'Travel time to Paris by car in hours',
        type: 'number',
        higherBetter: false,
        sourceUrl: 'https://maps.google.com/',
        unit: 'hours',
        format: 'decimal',
        precision: 1
      },
      distanceToParisWithTrain: {
        label: 'Time to Paris (Train)',
        icon: Train,
        tooltip: 'Travel time to Paris by train in hours',
        type: 'number',
        higherBetter: false,
        sourceUrl: 'https://www.sncf.com/',
        unit: 'hours',
        format: 'decimal',
        precision: 1
      },
      distanceToLyonWithCar: {
        label: 'Time to Lyon (Car)',
        icon: Car,
        tooltip: 'Travel time to Lyon by car in hours',
        type: 'number',
        higherBetter: false,
        sourceUrl: 'https://maps.google.com/',
        unit: 'hours',
        format: 'decimal',
        precision: 1
      },
      distanceToLyonWithTrain: {
        label: 'Time to Lyon (Train)',
        icon: Train,
        tooltip: 'Travel time to Lyon by train in hours',
        type: 'number',
        higherBetter: false,
        sourceUrl: 'https://www.sncf.com/',
        unit: 'hours',
        format: 'decimal',
        precision: 1
      }
    }
  },
  geography: {
    title: 'Geography',
    metrics: {
      hikes: {
        label: 'Hikes',
        icon: Mountain,
        tooltip: 'Number of hiking trails available',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.openstreetmap.org/',
        unit: '',
        format: 'integer',
        precision: 0
      },
      hikesTotalLength: {
        label: 'Hike Length',
        icon: Mountain,
        tooltip: 'Total length of all hiking trails in kilometers',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.openstreetmap.org/',
        unit: 'km',
        format: 'decimal',
        precision: 1
      }
    }
  },
  housing: {
    title: 'Housing',
    metrics: {
      avgSellPricePerM2: {
        label: 'Avg House Price',
        icon: Home,
        tooltip: 'Average house selling price per m²',
        type: 'number',
        higherBetter: false,
        sourceUrl: 'https://www.meilleursagents.com/',
        unit: '€/m²',
        format: 'integer',
        precision: 0
      },
      avgRentPricePerM2: {
        label: 'Avg Rent',
        icon: Home,
        tooltip: 'Average monthly rent price per m²',
        type: 'number',
        higherBetter: false,
        sourceUrl: 'https://www.seloger.com/',
        unit: '€/m²',
        format: 'integer',
        precision: 0
      }
    }
  },
  qualityOfLife: {
    title: 'Quality of Life',
    metrics: {
      crimeRate: {
        label: 'Crime Rate',
        icon: Shield,
        tooltip: 'Crime rate per 1000 inhabitants (lower is better)',
        type: 'number',
        higherBetter: false,
        sourceUrl: 'https://www.interieur.gouv.fr/',
        unit: '',
        format: 'decimal',
        precision: 1
      },
      greenSpaces: {
        label: 'Green Spaces',
        icon: Leaf,
        tooltip: 'Green spaces quality score (1-10)',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.ecologie.gouv.fr/',
        unit: '',
        format: 'decimal',
        precision: 1
      },
      airQuality: {
        label: 'Air Quality',
        icon: Wind,
        tooltip: 'Air quality score (1-10)',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.airparif.asso.fr/',
        unit: '',
        format: 'decimal',
        precision: 1
      },
      costOfLife: {
        label: 'Cost of Life',
        icon: DollarSign,
        tooltip: 'Cost of living index (higher is better)',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.numbeo.com/',
        unit: '',
        format: 'decimal',
        precision: 1
      },
      liveabilityScore: {
        label: 'Liveability',
        icon: Star,
        tooltip: 'Overall liveability score (1-10)',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://www.data.gouv.fr/',
        unit: '',
        format: 'decimal',
        precision: 1
      },
      healthQuality: {
        label: 'Health Quality',
        icon: Heart,
        tooltip: 'Healthcare quality score (1-10)',
        type: 'number',
        higherBetter: true,
        sourceUrl: 'https://solidarites-sante.gouv.fr/',
        unit: '',
        format: 'decimal',
        precision: 1
      }
    }
  }
};

/**
 * Get metric configuration by category and metric key
 */
export function getMetricConfig(category, metric) {
  return METRIC_CONFIG[category]?.metrics[metric];
}

/**
 * Get section title by category
 */
export function getSectionTitle(category) {
  return METRIC_CONFIG[category]?.title || category;
}

/**
 * Get metric label by category and metric key
 */
export function getMetricLabel(category, metric) {
  return getMetricConfig(category, metric)?.label || metric;
}

/**
 * Get all metrics for a category
 */
export function getCategoryMetrics(category) {
  return METRIC_CONFIG[category]?.metrics || {};
}

/**
 * Get all categories
 */
export function getCategories() {
  return Object.keys(METRIC_CONFIG);
}
