export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'Portugal': ['Lisboa', 'Porto', 'Braga', 'Coimbra', 'Faro', 'Aveiro', 'Setúbal', 'Funchal', 'Viseu', 'Leiria', 'Évora', 'Cascais', 'Sintra', 'Almada', 'Amadora'],
  'España': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Bilbao', 'Alicante', 'Zaragoza', 'Palma de Mallorca', 'Las Palmas'],
  'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux', 'Lille'],
};

export const ALL_CITIES = Object.values(CITIES_BY_COUNTRY).flat();
