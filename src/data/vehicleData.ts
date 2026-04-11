// Marcas e modelos populares no Brasil para motoristas de app
export const vehicleBrands: Record<string, string[]> = {
  'Chevrolet': [
    'Onix', 'Onix Plus', 'Prisma', 'Cobalt', 'Cruze', 'Tracker', 'Spin', 'Montana', 'S10',
    'Joy', 'Joy Plus', 'Equinox', 'Trailblazer',
  ],
  'Volkswagen': [
    'Gol', 'Voyage', 'Polo', 'Virtus', 'T-Cross', 'Nivus', 'Saveiro', 'Amarok',
    'Jetta', 'Tiguan', 'Taos', 'Fox', 'Up!',
  ],
  'Fiat': [
    'Uno', 'Mobi', 'Argo', 'Cronos', 'Strada', 'Toro', 'Pulse', 'Fastback',
    'Siena', 'Palio', 'Punto', 'Fiorino', 'Doblo', 'Ducato',
  ],
  'Ford': [
    'Ka', 'Ka+', 'Ka Sedan', 'Fiesta', 'Focus', 'EcoSport', 'Ranger', 'Territory',
    'Bronco Sport', 'Maverick',
  ],
  'Hyundai': [
    'HB20', 'HB20S', 'Creta', 'Tucson', 'ix35', 'Santa Fe', 'HB20X',
    'Azera', 'Veloster', 'Elantra',
  ],
  'Toyota': [
    'Corolla', 'Corolla Cross', 'Yaris', 'Yaris Sedan', 'Hilux', 'SW4',
    'Etios', 'Etios Sedan', 'RAV4', 'Camry', 'Prius',
  ],
  'Honda': [
    'Civic', 'City', 'Fit', 'HR-V', 'WR-V', 'CR-V', 'ZR-V',
    'Accord',
  ],
  'Renault': [
    'Kwid', 'Sandero', 'Logan', 'Stepway', 'Duster', 'Captur', 'Oroch',
    'Master', 'Kangoo',
  ],
  'Nissan': [
    'Versa', 'Sentra', 'Kicks', 'March', 'Frontier', 'Leaf',
  ],
  'Jeep': [
    'Renegade', 'Compass', 'Commander', 'Gladiator', 'Wrangler',
  ],
  'Citroën': [
    'C3', 'C4 Cactus', 'C4 Lounge', 'Aircross', 'Berlingo', 'Jumpy',
  ],
  'Peugeot': [
    '208', '2008', '3008', '308', 'Partner', 'Expert',
  ],
  'Kia': [
    'Cerato', 'Sportage', 'Seltos', 'Stonic', 'Carnival', 'Soul',
  ],
  'Mitsubishi': [
    'L200', 'Outlander', 'Eclipse Cross', 'ASX', 'Pajero Sport',
  ],
  'Caoa Chery': [
    'Tiggo 2', 'Tiggo 3X', 'Tiggo 5X', 'Tiggo 7', 'Tiggo 8', 'Arrizo 6',
  ],
  'BYD': [
    'Dolphin', 'Dolphin Mini', 'Song Plus', 'Yuan Plus', 'Seal', 'Han', 'Tan', 'King',
  ],
  'GWM': [
    'Haval H6', 'Haval Jolion', 'Ora 03',
  ],
  'RAM': [
    'Rampage', '1500', '2500', '3500',
  ],
  'Outro': [],
};

export const vehicleColors = [
  { value: 'branco', label: 'Branco', hex: '#FFFFFF' },
  { value: 'prata', label: 'Prata', hex: '#C0C0C0' },
  { value: 'preto', label: 'Preto', hex: '#1a1a1a' },
  { value: 'cinza', label: 'Cinza', hex: '#808080' },
  { value: 'vermelho', label: 'Vermelho', hex: '#DC2626' },
  { value: 'azul', label: 'Azul', hex: '#2563EB' },
  { value: 'azul_escuro', label: 'Azul Escuro', hex: '#1E3A5F' },
  { value: 'marrom', label: 'Marrom', hex: '#8B4513' },
  { value: 'bege', label: 'Bege', hex: '#D4C5A9' },
  { value: 'verde', label: 'Verde', hex: '#16A34A' },
  { value: 'amarelo', label: 'Amarelo', hex: '#EAB308' },
  { value: 'laranja', label: 'Laranja', hex: '#EA580C' },
  { value: 'dourado', label: 'Dourado', hex: '#C5A059' },
  { value: 'vinho', label: 'Vinho', hex: '#722F37' },
  { value: 'rosa', label: 'Rosa', hex: '#EC4899' },
  { value: 'outro', label: 'Outra', hex: '#6B7280' },
];

// Generate year range: current year + 1 down to 2000
const currentYear = new Date().getFullYear();
export const vehicleYears = Array.from({ length: currentYear - 1999 + 1 }, (_, i) => currentYear + 1 - i);

export const brandNames = Object.keys(vehicleBrands).sort((a, b) => {
  if (a === 'Outro') return 1;
  if (b === 'Outro') return -1;
  return a.localeCompare(b);
});
