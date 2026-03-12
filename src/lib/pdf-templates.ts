export type RGB = [number, number, number];

export interface PdfTemplate {
  id: string;
  name: string;
  category: string;
  colors: {
    bg: RGB;
    bgCard: RGB;
    primary: RGB;
    secondary: RGB;
    accent: RGB;
    accent2: RGB;
    white: RGB;
    lightGray: RGB;
    midGray: RGB;
    darkGray: RGB;
    highlight: RGB;
  };
}

export const pdfTemplates: PdfTemplate[] = [
  // ── CYBERPUNK / NEON ──
  {
    id: "cyber-magenta",
    name: "Cyber Magenta",
    category: "Cyberpunk",
    colors: {
      bg: [10, 0, 21], bgCard: [17, 5, 32],
      primary: [255, 0, 255], secondary: [0, 255, 255], accent: [157, 0, 255], accent2: [0, 255, 153],
      white: [255, 255, 255], lightGray: [226, 232, 240], midGray: [148, 163, 175], darkGray: [100, 116, 139],
      highlight: [255, 200, 50],
    },
  },
  {
    id: "neon-blue",
    name: "Neon Blue",
    category: "Cyberpunk",
    colors: {
      bg: [5, 5, 25], bgCard: [10, 10, 40],
      primary: [0, 150, 255], secondary: [0, 255, 200], accent: [80, 0, 255], accent2: [255, 100, 200],
      white: [255, 255, 255], lightGray: [210, 220, 240], midGray: [140, 150, 180], darkGray: [90, 100, 130],
      highlight: [0, 255, 255],
    },
  },
  {
    id: "neon-green",
    name: "Neon Green",
    category: "Cyberpunk",
    colors: {
      bg: [5, 15, 5], bgCard: [10, 25, 10],
      primary: [0, 255, 100], secondary: [0, 200, 255], accent: [180, 255, 0], accent2: [255, 0, 200],
      white: [255, 255, 255], lightGray: [220, 240, 220], midGray: [150, 170, 150], darkGray: [100, 120, 100],
      highlight: [255, 255, 0],
    },
  },
  {
    id: "neon-orange",
    name: "Neon Orange",
    category: "Cyberpunk",
    colors: {
      bg: [20, 5, 0], bgCard: [35, 10, 5],
      primary: [255, 120, 0], secondary: [255, 200, 0], accent: [255, 0, 100], accent2: [0, 200, 255],
      white: [255, 255, 255], lightGray: [240, 225, 210], midGray: [175, 155, 140], darkGray: [120, 100, 85],
      highlight: [255, 255, 100],
    },
  },
  {
    id: "neon-red",
    name: "Neon Red",
    category: "Cyberpunk",
    colors: {
      bg: [20, 0, 5], bgCard: [35, 5, 10],
      primary: [255, 30, 60], secondary: [255, 150, 0], accent: [200, 0, 255], accent2: [0, 255, 200],
      white: [255, 255, 255], lightGray: [240, 215, 220], midGray: [175, 140, 150], darkGray: [120, 90, 100],
      highlight: [255, 200, 50],
    },
  },
  // ── DARK PROFESSIONAL ──
  {
    id: "dark-navy",
    name: "Dark Navy",
    category: "Profissional",
    colors: {
      bg: [15, 20, 35], bgCard: [25, 30, 50],
      primary: [70, 130, 255], secondary: [100, 200, 255], accent: [150, 100, 255], accent2: [50, 220, 180],
      white: [255, 255, 255], lightGray: [200, 210, 230], midGray: [140, 150, 170], darkGray: [90, 100, 120],
      highlight: [255, 200, 80],
    },
  },
  {
    id: "dark-charcoal",
    name: "Dark Charcoal",
    category: "Profissional",
    colors: {
      bg: [25, 25, 25], bgCard: [40, 40, 40],
      primary: [200, 200, 200], secondary: [150, 150, 150], accent: [255, 180, 0], accent2: [100, 200, 255],
      white: [255, 255, 255], lightGray: [220, 220, 220], midGray: [160, 160, 160], darkGray: [110, 110, 110],
      highlight: [255, 200, 50],
    },
  },
  {
    id: "dark-emerald",
    name: "Dark Emerald",
    category: "Profissional",
    colors: {
      bg: [10, 20, 15], bgCard: [15, 35, 25],
      primary: [0, 200, 120], secondary: [50, 255, 180], accent: [0, 150, 200], accent2: [200, 255, 100],
      white: [255, 255, 255], lightGray: [210, 230, 220], midGray: [140, 170, 155], darkGray: [90, 120, 105],
      highlight: [255, 220, 50],
    },
  },
  {
    id: "dark-burgundy",
    name: "Dark Burgundy",
    category: "Profissional",
    colors: {
      bg: [25, 10, 15], bgCard: [40, 15, 25],
      primary: [200, 50, 80], secondary: [255, 100, 120], accent: [255, 180, 100], accent2: [180, 50, 200],
      white: [255, 255, 255], lightGray: [235, 215, 220], midGray: [170, 145, 155], darkGray: [115, 95, 105],
      highlight: [255, 200, 100],
    },
  },
  {
    id: "dark-slate",
    name: "Dark Slate",
    category: "Profissional",
    colors: {
      bg: [20, 25, 30], bgCard: [30, 40, 50],
      primary: [100, 180, 255], secondary: [60, 220, 200], accent: [255, 150, 50], accent2: [180, 100, 255],
      white: [255, 255, 255], lightGray: [210, 220, 230], midGray: [145, 160, 175], darkGray: [95, 110, 125],
      highlight: [255, 210, 70],
    },
  },
  // ── CORPORATE / LIGHT ──
  {
    id: "corp-blue",
    name: "Corporativo Azul",
    category: "Corporativo",
    colors: {
      bg: [240, 245, 255], bgCard: [255, 255, 255],
      primary: [30, 80, 180], secondary: [50, 130, 220], accent: [255, 120, 0], accent2: [0, 160, 120],
      white: [30, 40, 60], lightGray: [60, 70, 90], midGray: [100, 110, 130], darkGray: [160, 170, 190],
      highlight: [255, 180, 0],
    },
  },
  {
    id: "corp-gray",
    name: "Corporativo Cinza",
    category: "Corporativo",
    colors: {
      bg: [245, 245, 248], bgCard: [255, 255, 255],
      primary: [50, 50, 60], secondary: [80, 80, 95], accent: [200, 50, 50], accent2: [50, 150, 200],
      white: [30, 30, 40], lightGray: [60, 60, 75], midGray: [110, 110, 125], darkGray: [170, 170, 185],
      highlight: [200, 50, 50],
    },
  },
  {
    id: "corp-green",
    name: "Corporativo Verde",
    category: "Corporativo",
    colors: {
      bg: [240, 250, 245], bgCard: [255, 255, 255],
      primary: [20, 120, 80], secondary: [40, 170, 120], accent: [255, 150, 0], accent2: [30, 100, 180],
      white: [20, 50, 35], lightGray: [50, 80, 65], midGray: [100, 130, 115], darkGray: [160, 190, 175],
      highlight: [255, 160, 0],
    },
  },
  {
    id: "corp-wine",
    name: "Corporativo Vinho",
    category: "Corporativo",
    colors: {
      bg: [250, 242, 245], bgCard: [255, 255, 255],
      primary: [130, 20, 50], secondary: [180, 40, 70], accent: [255, 170, 0], accent2: [50, 120, 180],
      white: [50, 20, 30], lightGray: [80, 50, 60], midGray: [130, 100, 110], darkGray: [180, 160, 165],
      highlight: [255, 170, 0],
    },
  },
  {
    id: "corp-navy-light",
    name: "Corporativo Marinho",
    category: "Corporativo",
    colors: {
      bg: [235, 240, 250], bgCard: [255, 255, 255],
      primary: [20, 40, 100], secondary: [40, 70, 150], accent: [220, 80, 0], accent2: [0, 140, 180],
      white: [15, 25, 60], lightGray: [40, 55, 90], midGray: [90, 105, 140], darkGray: [150, 165, 195],
      highlight: [220, 130, 0],
    },
  },
  // ── MODERN / GRADIENT ──
  {
    id: "sunset",
    name: "Pôr do Sol",
    category: "Moderno",
    colors: {
      bg: [25, 10, 20], bgCard: [40, 15, 35],
      primary: [255, 100, 50], secondary: [255, 180, 50], accent: [255, 50, 100], accent2: [200, 100, 255],
      white: [255, 255, 255], lightGray: [240, 220, 215], midGray: [175, 150, 145], darkGray: [120, 100, 95],
      highlight: [255, 220, 100],
    },
  },
  {
    id: "aurora",
    name: "Aurora Boreal",
    category: "Moderno",
    colors: {
      bg: [5, 10, 25], bgCard: [10, 20, 45],
      primary: [0, 200, 150], secondary: [100, 50, 255], accent: [255, 100, 200], accent2: [0, 255, 200],
      white: [255, 255, 255], lightGray: [210, 225, 240], midGray: [140, 160, 180], darkGray: [90, 110, 130],
      highlight: [150, 255, 200],
    },
  },
  {
    id: "midnight",
    name: "Meia-Noite",
    category: "Moderno",
    colors: {
      bg: [10, 10, 30], bgCard: [20, 20, 50],
      primary: [100, 100, 255], secondary: [180, 100, 255], accent: [255, 200, 100], accent2: [100, 255, 200],
      white: [255, 255, 255], lightGray: [200, 200, 240], midGray: [140, 140, 180], darkGray: [90, 90, 130],
      highlight: [255, 220, 100],
    },
  },
  {
    id: "lavender",
    name: "Lavanda",
    category: "Moderno",
    colors: {
      bg: [20, 10, 30], bgCard: [35, 20, 50],
      primary: [180, 120, 255], secondary: [255, 150, 200], accent: [100, 200, 255], accent2: [200, 255, 150],
      white: [255, 255, 255], lightGray: [230, 220, 240], midGray: [165, 155, 180], darkGray: [110, 100, 130],
      highlight: [255, 200, 150],
    },
  },
  {
    id: "ocean",
    name: "Oceano",
    category: "Moderno",
    colors: {
      bg: [5, 15, 25], bgCard: [10, 25, 45],
      primary: [0, 150, 220], secondary: [0, 200, 180], accent: [255, 150, 50], accent2: [100, 255, 200],
      white: [255, 255, 255], lightGray: [210, 225, 235], midGray: [140, 160, 175], darkGray: [90, 110, 125],
      highlight: [0, 230, 200],
    },
  },
  // ── MINIMAL ──
  {
    id: "mono-white",
    name: "Mono Branco",
    category: "Minimalista",
    colors: {
      bg: [255, 255, 255], bgCard: [248, 248, 252],
      primary: [30, 30, 35], secondary: [60, 60, 70], accent: [30, 30, 35], accent2: [100, 100, 110],
      white: [20, 20, 25], lightGray: [50, 50, 60], midGray: [120, 120, 130], darkGray: [180, 180, 190],
      highlight: [30, 30, 35],
    },
  },
  {
    id: "mono-dark",
    name: "Mono Escuro",
    category: "Minimalista",
    colors: {
      bg: [18, 18, 18], bgCard: [28, 28, 28],
      primary: [230, 230, 230], secondary: [180, 180, 180], accent: [230, 230, 230], accent2: [150, 150, 150],
      white: [240, 240, 240], lightGray: [200, 200, 200], midGray: [140, 140, 140], darkGray: [90, 90, 90],
      highlight: [255, 255, 255],
    },
  },
  {
    id: "warm-beige",
    name: "Bege Quente",
    category: "Minimalista",
    colors: {
      bg: [250, 245, 235], bgCard: [255, 252, 245],
      primary: [80, 60, 40], secondary: [140, 100, 60], accent: [200, 120, 50], accent2: [60, 120, 100],
      white: [60, 45, 30], lightGray: [90, 75, 60], midGray: [140, 125, 110], darkGray: [190, 180, 170],
      highlight: [200, 130, 50],
    },
  },
  {
    id: "cool-mint",
    name: "Menta Fresca",
    category: "Minimalista",
    colors: {
      bg: [240, 252, 250], bgCard: [250, 255, 254],
      primary: [20, 80, 70], secondary: [40, 140, 120], accent: [0, 180, 140], accent2: [50, 100, 200],
      white: [15, 60, 50], lightGray: [40, 90, 80], midGray: [100, 150, 140], darkGray: [170, 200, 195],
      highlight: [0, 180, 140],
    },
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    category: "Minimalista",
    colors: {
      bg: [252, 245, 248], bgCard: [255, 250, 252],
      primary: [160, 80, 100], secondary: [200, 120, 140], accent: [220, 150, 100], accent2: [100, 120, 180],
      white: [80, 40, 55], lightGray: [110, 70, 85], midGray: [155, 125, 135], darkGray: [200, 180, 185],
      highlight: [220, 150, 100],
    },
  },
  // ── BOLD / CREATIVE ──
  {
    id: "electric-violet",
    name: "Violeta Elétrico",
    category: "Criativo",
    colors: {
      bg: [15, 0, 30], bgCard: [25, 5, 50],
      primary: [180, 0, 255], secondary: [255, 50, 150], accent: [0, 255, 200], accent2: [255, 200, 0],
      white: [255, 255, 255], lightGray: [225, 215, 240], midGray: [160, 145, 180], darkGray: [105, 90, 130],
      highlight: [255, 200, 0],
    },
  },
  {
    id: "toxic-green",
    name: "Verde Tóxico",
    category: "Criativo",
    colors: {
      bg: [0, 10, 5], bgCard: [5, 20, 10],
      primary: [0, 255, 0], secondary: [150, 255, 0], accent: [255, 255, 0], accent2: [0, 200, 255],
      white: [255, 255, 255], lightGray: [210, 240, 220], midGray: [140, 180, 155], darkGray: [90, 130, 105],
      highlight: [255, 255, 0],
    },
  },
  {
    id: "hot-pink",
    name: "Rosa Quente",
    category: "Criativo",
    colors: {
      bg: [25, 5, 15], bgCard: [40, 10, 25],
      primary: [255, 50, 150], secondary: [255, 150, 200], accent: [0, 200, 255], accent2: [255, 200, 50],
      white: [255, 255, 255], lightGray: [240, 215, 225], midGray: [180, 145, 160], darkGray: [125, 95, 110],
      highlight: [255, 200, 100],
    },
  },
  {
    id: "golden-black",
    name: "Preto e Ouro",
    category: "Criativo",
    colors: {
      bg: [10, 10, 5], bgCard: [20, 20, 10],
      primary: [220, 180, 50], secondary: [255, 210, 80], accent: [180, 140, 30], accent2: [100, 200, 255],
      white: [255, 255, 255], lightGray: [240, 230, 200], midGray: [180, 170, 140], darkGray: [120, 115, 90],
      highlight: [255, 220, 100],
    },
  },
  {
    id: "arctic-ice",
    name: "Gelo Ártico",
    category: "Criativo",
    colors: {
      bg: [5, 15, 25], bgCard: [10, 25, 40],
      primary: [150, 220, 255], secondary: [200, 240, 255], accent: [255, 255, 255], accent2: [100, 180, 255],
      white: [255, 255, 255], lightGray: [220, 235, 245], midGray: [160, 180, 200], darkGray: [100, 125, 150],
      highlight: [200, 240, 255],
    },
  },
  // ── PREMIUM (Inspired by top presentation design trends) ──
  {
    id: "premium-sapphire",
    name: "Safira Premium",
    category: "Premium",
    colors: {
      bg: [8, 12, 38], bgCard: [14, 20, 55],
      primary: [60, 100, 255], secondary: [120, 180, 255], accent: [255, 200, 60], accent2: [0, 220, 180],
      white: [255, 255, 255], lightGray: [200, 210, 235], midGray: [130, 145, 175], darkGray: [80, 95, 125],
      highlight: [255, 210, 80],
    },
  },
  {
    id: "premium-obsidian",
    name: "Obsidiana",
    category: "Premium",
    colors: {
      bg: [12, 12, 14], bgCard: [22, 22, 26],
      primary: [255, 90, 60], secondary: [255, 160, 100], accent: [255, 60, 120], accent2: [60, 200, 255],
      white: [255, 255, 255], lightGray: [225, 220, 218], midGray: [165, 158, 155], darkGray: [105, 100, 98],
      highlight: [255, 180, 60],
    },
  },
  {
    id: "premium-jade",
    name: "Jade Imperial",
    category: "Premium",
    colors: {
      bg: [5, 18, 18], bgCard: [10, 30, 30],
      primary: [0, 220, 160], secondary: [80, 255, 200], accent: [255, 200, 80], accent2: [0, 160, 255],
      white: [255, 255, 255], lightGray: [210, 235, 230], midGray: [145, 175, 170], darkGray: [90, 120, 115],
      highlight: [255, 220, 100],
    },
  },
  {
    id: "premium-titanium",
    name: "Titânio",
    category: "Premium",
    colors: {
      bg: [22, 24, 28], bgCard: [35, 38, 45],
      primary: [180, 190, 210], secondary: [220, 225, 240], accent: [100, 160, 255], accent2: [255, 180, 100],
      white: [255, 255, 255], lightGray: [210, 215, 225], midGray: [150, 155, 170], darkGray: [95, 100, 115],
      highlight: [100, 170, 255],
    },
  },
  {
    id: "premium-amethyst",
    name: "Ametista",
    category: "Premium",
    colors: {
      bg: [18, 8, 28], bgCard: [30, 15, 45],
      primary: [160, 80, 255], secondary: [200, 140, 255], accent: [255, 100, 180], accent2: [80, 220, 255],
      white: [255, 255, 255], lightGray: [225, 215, 240], midGray: [162, 148, 180], darkGray: [108, 95, 125],
      highlight: [255, 180, 200],
    },
  },
  {
    id: "premium-coral",
    name: "Coral Reef",
    category: "Premium",
    colors: {
      bg: [20, 10, 12], bgCard: [35, 18, 22],
      primary: [255, 110, 100], secondary: [255, 170, 130], accent: [255, 80, 150], accent2: [80, 200, 220],
      white: [255, 255, 255], lightGray: [240, 220, 218], midGray: [180, 155, 152], darkGray: [122, 100, 98],
      highlight: [255, 200, 120],
    },
  },
  {
    id: "premium-carbon",
    name: "Fibra de Carbono",
    category: "Premium",
    colors: {
      bg: [15, 15, 18], bgCard: [25, 25, 30],
      primary: [0, 200, 255], secondary: [100, 220, 255], accent: [255, 60, 60], accent2: [0, 255, 150],
      white: [255, 255, 255], lightGray: [215, 220, 230], midGray: [150, 158, 170], darkGray: [95, 100, 112],
      highlight: [0, 230, 255],
    },
  },
  {
    id: "premium-ivory",
    name: "Marfim Luxo",
    category: "Premium",
    colors: {
      bg: [252, 248, 240], bgCard: [255, 253, 248],
      primary: [45, 35, 25], secondary: [90, 70, 50], accent: [180, 140, 60], accent2: [60, 100, 140],
      white: [35, 28, 20], lightGray: [65, 55, 45], midGray: [130, 118, 105], darkGray: [195, 185, 175],
      highlight: [190, 150, 70],
    },
  },
  {
    id: "premium-mercury",
    name: "Mercúrio",
    category: "Premium",
    colors: {
      bg: [16, 18, 24], bgCard: [26, 30, 40],
      primary: [200, 210, 230], secondary: [160, 175, 200], accent: [255, 200, 80], accent2: [80, 200, 200],
      white: [255, 255, 255], lightGray: [210, 215, 228], midGray: [148, 155, 172], darkGray: [92, 98, 115],
      highlight: [255, 215, 100],
    },
  },
  {
    id: "premium-eclipse",
    name: "Eclipse Solar",
    category: "Premium",
    colors: {
      bg: [8, 5, 15], bgCard: [15, 10, 28],
      primary: [255, 180, 0], secondary: [255, 220, 80], accent: [255, 100, 50], accent2: [100, 50, 255],
      white: [255, 255, 255], lightGray: [240, 230, 210], midGray: [178, 168, 148], darkGray: [118, 110, 95],
      highlight: [255, 200, 50],
    },
  },
];

export const templateCategories = [...new Set(pdfTemplates.map((t) => t.category))];

export function getTemplateById(id: string): PdfTemplate {
  return pdfTemplates.find((t) => t.id === id) || pdfTemplates[0];
}
