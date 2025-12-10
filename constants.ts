import { Transaction, Category, CreditCard } from './types';

export const COLORS = {
  primary: '#38e07b',
  backgroundDark: '#122017',
  backgroundLight: '#f6f8f7',
  textMuted: '#9eb7a8',
  chart: {
    food: '#38e07b',
    leisure: '#e0a038',
    transport: '#389ce0',
    home: '#e0388f',
    health: '#9038e0',
  }
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', category: 'Comida', subcategory: 'Restaurante', amount: 450.50, date: '2023-10-24', icon: 'restaurant', color: COLORS.chart.food, currency: 'USD' },
  { id: '2', category: 'Ocio', subcategory: 'Cine', amount: 312.00, date: '2023-10-23', icon: 'celebration', color: COLORS.chart.leisure, currency: 'USD' },
  { id: '3', category: 'Transporte', subcategory: 'Uber', amount: 250.25, date: '2023-10-23', icon: 'train', color: COLORS.chart.transport, currency: 'USD' },
  { id: '4', category: 'Hogar', subcategory: 'Internet', amount: 125.00, date: '2023-10-22', icon: 'home', color: COLORS.chart.home, currency: 'USD' },
  { id: '5', category: 'Comida', subcategory: 'Supermercado', amount: 15.50, date: '2023-10-24', icon: 'restaurant', color: COLORS.chart.food, currency: 'USD' },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Hogar', icon: 'home', color: 'blue', subcategories: ['Alquiler', 'Servicios', 'Electricidad', 'Agua', 'Gas', 'Internet', 'TV/Cable', 'Seguro del hogar', 'Reparaciones', 'Muebles', 'Decoración'] },
  { id: '2', name: 'Comida', icon: 'restaurant', color: 'orange', subcategories: ['Supermercado', 'Restaurantes', 'Delivery', 'Café', 'Bebidas', 'Alcohol', 'Comida rápida', 'Desayuno'] },
  { id: '3', name: 'Transporte', icon: 'directions_car', color: 'purple', subcategories: ['Gasolina', 'Mantenimiento', 'Estacionamiento', 'Peajes', 'Taxi/Uber', 'Transporte público', 'Seguro del auto', 'Multas'] },
  { id: '4', name: 'Ocio', icon: 'sports_esports', color: 'pink', subcategories: ['Cine', 'Juegos', 'Conciertos', 'Eventos', 'Streaming', 'Libros', 'Revistas', 'Hobbies'] },
  { id: '5', name: 'Salud', icon: 'local_hospital', color: 'red', subcategories: ['Médico', 'Dentista', 'Farmacia', 'Seguro médico', 'Gimnasio', 'Fisioterapia', 'Óptica', 'Laboratorios'] },
  { id: '6', name: 'Educación', icon: 'school', color: 'green', subcategories: ['Matrícula', 'Libros', 'Materiales', 'Cursos', 'Tutorías', 'Certificaciones', 'Software educativo'] },
  { id: '7', name: 'Ropa', icon: 'checkroom', color: 'indigo', subcategories: ['Ropa', 'Zapatos', 'Accesorios', 'Lavandería', 'Arreglos', 'Cosméticos', 'Perfumes'] },
  { id: '8', name: 'Tecnología', icon: 'devices', color: 'cyan', subcategories: ['Electrónica', 'Software', 'Aplicaciones', 'Reparaciones', 'Accesorios', 'Suscripciones digitales'] },
  { id: '9', name: 'Viajes', icon: 'flight', color: 'teal', subcategories: ['Vuelos', 'Hoteles', 'Alquiler de auto', 'Tours', 'Comidas en viaje', 'Souvenirs', 'Seguro de viaje'] },
  { id: '10', name: 'Regalos', icon: 'card_giftcard', color: 'rose', subcategories: ['Cumpleaños', 'Aniversario', 'Navidad', 'Bodas', 'Baby shower', 'Otros'] },
  { id: '11', name: 'Mascotas', icon: 'pets', color: 'amber', subcategories: ['Veterinario', 'Comida', 'Juguetes', 'Accesorios', 'Peluquería', 'Seguro', 'Medicamentos'] },
  { id: '12', name: 'Finanzas', icon: 'account_balance', color: 'emerald', subcategories: ['Impuestos', 'Comisiones bancarias', 'Seguros', 'Inversiones', 'Préstamos', 'Intereses', 'Transferencias'] },
  { id: '13', name: 'Servicios', icon: 'build', color: 'slate', subcategories: ['Plomería', 'Electricidad', 'Limpieza', 'Jardinería', 'Cerrajería', 'Pintura', 'Carpintería'] },
  { id: '14', name: 'Deportes', icon: 'fitness_center', color: 'lime', subcategories: ['Equipamiento', 'Inscripciones', 'Clases', 'Eventos deportivos', 'Suplementos'] },
  { id: '15', name: 'Belleza', icon: 'spa', color: 'fuchsia', subcategories: ['Peluquería', 'Manicure', 'Faciales', 'Masajes', 'Tratamientos', 'Productos'] },
];

export const CARD_IMAGES: Record<CreditCard['network'], string> = {
  'Visa': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrxSzBELz5RsE7pUqf7pSggFU6RLnM9kiJQ3ETPR1YAI-hLoQVsApdxj_dWmldWj9N4qKd4k2Z2P3ZC6wakqCPqzZAIXI-b8utyFtdppWi8CvMoeGSj02g0qkRfoFTnhHy1W-tL_rkhxDe6Jb43WmAad9m7yf0D5NpNbiy6ruwAHmodGIW6v5J0cDfvLdKs-KByASHlZaaWohvKUIkX79_HHvIPWenuYispv9Wgf_Wk2BCVhAWoVPF20GXhDoEM-Z1xdKmnyMCenA1',
  'Visa Débito': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrxSzBELz5RsE7pUqf7pSggFU6RLnM9kiJQ3ETPR1YAI-hLoQVsApdxj_dWmldWj9N4qKd4k2Z2P3ZC6wakqCPqzZAIXI-b8utyFtdppWi8CvMoeGSj02g0qkRfoFTnhHy1W-tL_rkhxDe6Jb43WmAad9m7yf0D5NpNbiy6ruwAHmodGIW6v5J0cDfvLdKs-KByASHlZaaWohvKUIkX79_HHvIPWenuYispv9Wgf_Wk2BCVhAWoVPF20GXhDoEM-Z1xdKmnyMCenA1',
  'Mastercard': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAN2xSxI7TALvj0I10V_mVonsXyJuI74nDi5U-kDi86p1TVjgPjAQNpMZvQKngoae7B5mZPfqyfq-Javs4TkJ-6f7Zv2rZoXZXjJbzVHMNhN_-VZgAdIU4GS_qVOIAx9dQ_0CuqdPli8ULF9X21m8u6M9rXQGHo3AU9crD2mmcuNxEqqS2fbfS5ImKgJN7Ranf_a3smdUJPDBxwqKwOragDieJDf-UUhPLcoti0chygtmvWji4PyO029Kb6NauUF5y1A92VAwat2Q4b',
  'Mastercard Débito': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAN2xSxI7TALvj0I10V_mVonsXyJuI74nDi5U-kDi86p1TVjgPjAQNpMZvQKngoae7B5mZPfqyfq-Javs4TkJ-6f7Zv2rZoXZXjJbzVHMNhN_-VZgAdIU4GS_qVOIAx9dQ_0CuqdPli8ULF9X21m8u6M9rXQGHo3AU9crD2mmcuNxEqqS2fbfS5ImKgJN7Ranf_a3smdUJPDBxwqKwOragDieJDf-UUhPLcoti0chygtmvWji4PyO029Kb6NauUF5y1A92VAwat2Q4b',
  'American Express': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxhGDBOb3Bk6Pb1Q-s9ONq4QVGLQh7D0_vsTI0EI7YziIgqPxMjl4gyKQqZ_JRNNtD1G0iH8E-VP9776FTNUBkvr6K5yPVLi5eeooyXvPWh-ohrthYcx59Kti5zN39BtQytqtfck0YAEL1tQYksCNFGp7qhVrY73TW2RMz6K4_BVWb4mhW98Bs6Xr_aRZQJFYY4KehPGNNXu248M8vSQBF9x06iR6OrgZAQ8FKLCTRho4t7XNI7msgTzBkisChqBCOSLhPM1AkhuWo',
  'Mercadolibre': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxhGDBOb3Bk6Pb1Q-s9ONq4QVGLQh7D0_vsTI0EI7YziIgqPxMjl4gyKQqZ_JRNNtD1G0iH8E-VP9776FTNUBkvr6K5yPVLi5eeooyXvPWh-ohrthYcx59Kti5zN39BtQytqtfck0YAEL1tQYksCNFGp7qhVrY73TW2RMz6K4_BVWb4mhW98Bs6Xr_aRZQJFYY4KehPGNNXu248M8vSQBF9x06iR6OrgZAQ8FKLCTRho4t7XNI7msgTzBkisChqBCOSLhPM1AkhuWo',
};

export const MOCK_CARDS: CreditCard[] = [
  { id: '1', name: 'Banco Principal', last4: '1234', network: 'Visa', bgImage: CARD_IMAGES['Visa'] },
  { id: '2', name: 'Viajes', last4: '5678', network: 'Mastercard', bgImage: CARD_IMAGES['Mastercard'] },
  { id: '3', name: 'Compras Online', last4: '9012', network: 'Amex', bgImage: CARD_IMAGES['American Express'] },
];
