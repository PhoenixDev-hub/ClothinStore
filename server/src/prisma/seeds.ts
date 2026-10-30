import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { PrismaClient, ProductStatus } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const COLORS: Record<string, string> = {
  Branco: '#FFFFFF',
  Preto: '#111111',
  'Off White': '#F5F1E6',
  'Azul Marinho': '#1B2A49',
  'Azul Médio': '#4A78B5',
  'Azul Escuro': '#1F3556',
  Cinza: '#8A8D91',
  'Verde Militar': '#4B5320',
  Bege: '#D8C3A5',
  'Floral Rosa': '#E8A0B4',
  'Floral Azul': '#7FA6D6',
  Areia: '#D9C7A3',
};

type V = [size: string, color: string, stock: number];

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const catalog: {
  name: string;
  code: string;
  description: string;
  brand: string;
  material: string;
  price: number; // centavos
  compareAtPrice?: number;
  category: 'camisetas' | 'calcas' | 'vestidos';
  isNew?: boolean;
  isFeatured?: boolean;
  tags: string[];
  variants: V[];
}[] = [
  {
    name: 'Camiseta Básica Algodão',
    code: 'CAM-BAS',
    description: 'Camiseta 100% algodão penteado, caimento reto e toque macio.',
    brand: 'Urban Basics',
    material: '100% algodão',
    price: 5990,
    category: 'camisetas',
    isNew: true,
    isFeatured: true,
    tags: ['básico', 'verão'],
    variants: [
      ['P', 'Branco', 30],
      ['M', 'Branco', 42],
      ['G', 'Preto', 0],
    ],
  },
  {
    name: 'Camiseta Oversized Estampada',
    code: 'CAM-OVR',
    description: 'Modelagem oversized com estampa frontal em silk.',
    brand: 'Urban Basics',
    material: '100% algodão',
    price: 8990,
    compareAtPrice: 10990,
    category: 'camisetas',
    isNew: true,
    tags: ['oversized', 'estampada'],
    variants: [
      ['M', 'Off White', 18],
      ['G', 'Off White', 12],
      ['G', 'Preto', 20],
    ],
  },
  {
    name: 'Camiseta Polo Piquet',
    code: 'CAM-POL',
    description: 'Polo em malha piquet, gola e punhos em retilínea.',
    brand: 'Casa Norte',
    material: '65% algodão, 35% poliéster',
    price: 10990,
    category: 'camisetas',
    tags: ['polo', 'casual'],
    variants: [
      ['P', 'Azul Marinho', 8],
      ['M', 'Azul Marinho', 15],
    ],
  },
  {
    name: 'Calça Jeans Slim',
    code: 'CAL-JNS',
    description: 'Jeans com elastano, corte slim e lavagem média.',
    brand: 'Casa Norte',
    material: '98% algodão, 2% elastano',
    price: 18990,
    compareAtPrice: 22990,
    category: 'calcas',
    isFeatured: true,
    tags: ['jeans', 'slim'],
    variants: [
      ['M', 'Azul Médio', 14],
      ['G', 'Azul Médio', 9],
      ['G', 'Azul Escuro', 11],
    ],
  },
  {
    name: 'Calça Alfaiataria Cinza',
    code: 'CAL-ALF',
    description: 'Alfaiataria em tecido leve, cintura alta e vinco frontal.',
    brand: 'Maison Sul',
    material: '70% viscose, 30% poliéster',
    price: 22990,
    category: 'calcas',
    isNew: true,
    tags: ['alfaiataria', 'trabalho'],
    variants: [
      ['P', 'Cinza', 6],
      ['M', 'Cinza', 10],
    ],
  },
  {
    name: 'Calça Cargo Sarja',
    code: 'CAL-CRG',
    description: 'Sarja resistente com bolsos laterais e barra ajustável.',
    brand: 'Urban Basics',
    material: '100% algodão',
    price: 19990,
    category: 'calcas',
    tags: ['cargo', 'streetwear'],
    variants: [
      ['M', 'Verde Militar', 13],
      ['G', 'Verde Militar', 7],
      ['G', 'Bege', 0],
    ],
  },
  {
    name: 'Vestido Midi Floral',
    code: 'VES-MID',
    description:
      'Vestido midi em viscose com estampa floral e cintura marcada.',
    brand: 'Maison Sul',
    material: '100% viscose',
    price: 24990,
    compareAtPrice: 29990,
    category: 'vestidos',
    isNew: true,
    isFeatured: true,
    tags: ['floral', 'verão'],
    variants: [
      ['P', 'Floral Rosa', 10],
      ['M', 'Floral Rosa', 16],
      ['G', 'Floral Azul', 5],
    ],
  },
  {
    name: 'Vestido Longo Linho',
    code: 'VES-LIN',
    description: 'Vestido longo em linho misto, decote V e fenda lateral.',
    brand: 'Maison Sul',
    material: '55% linho, 45% viscose',
    price: 29990,
    category: 'vestidos',
    tags: ['linho', 'festa'],
    variants: [
      ['P', 'Areia', 4],
      ['M', 'Areia', 6],
    ],
  },
];

async function main() {
  // Fixture de desenvolvimento: zera produtos/categorias e reinicia os IDs,
  // garantindo categoria 1 = Roupas, 2/3/4 = filhas e produtos 1..8.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Product", "Category" RESTART IDENTITY CASCADE',
  );

  const roupas = await prisma.category.create({
    data: { name: 'Roupas', slug: 'roupas', position: 0 },
  });

  const children = [
    { name: 'Camisetas', slug: 'camisetas', position: 1 },
    { name: 'Calças', slug: 'calcas', position: 2 },
    { name: 'Vestidos', slug: 'vestidos', position: 3 },
  ];

  const categoryId: Record<string, number> = {};
  for (const c of children) {
    const cat = await prisma.category.create({
      data: { ...c, parentId: roupas.id },
    });
    categoryId[c.slug] = cat.id;
  }

  for (const p of catalog) {
    const slug = slugify(p.name);
    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        description: p.description,
        shortDescription: p.description.split('.')[0],
        brand: p.brand,
        material: p.material,
        tags: p.tags,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        images: [
          `https://picsum.photos/seed/${slug}-1/800/1000`,
          `https://picsum.photos/seed/${slug}-2/800/1000`,
        ],
        status: ProductStatus.ACTIVE,
        isNew: p.isNew ?? false,
        isFeatured: p.isFeatured ?? false,
        categoryId: categoryId[p.category],
        variants: {
          create: p.variants.map(([size, color, stock]) => ({
            sku: `${p.code}-${size}-${slugify(color).toUpperCase()}`,
            size,
            color,
            colorHex: COLORS[color],
            stock,
            available: true,
          })),
        },
      },
    });
  }

  console.log(
    `Seed concluído: ${catalog.length} produtos, ${children.length + 1} categorias.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
