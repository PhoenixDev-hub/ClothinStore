import type { Product } from "@/types";

const now = Date.now();
const day = 86_400_000;

const base = (p: Omit<Product, "isDemo" | "createdAt"> & { age: number }): Product => {
  const { age, ...rest } = p;
  return { ...rest, isDemo: true, createdAt: now - age * day };
};

const C = {
  preto: { name: "Preto", hex: "#111111" },
  vinho: { name: "Vinho", hex: "#7a1428" },
  oliva: { name: "Verde Oliva", hex: "#566b2f" },
  caramelo: { name: "Caramelo", hex: "#a8672a" },
  rosa: { name: "Rosa", hex: "#f4a6b8" },
  azul: { name: "Azul", hex: "#7aa7e0" },
  branco: { name: "Branco", hex: "#ffffff" },
  offwhite: { name: "Off-white", hex: "#f0ebe3" },
  dourado: { name: "Dourado", hex: "#d4a62a" },
  estampado: { name: "Estampado", hex: "#e885a8" },
};

export const SEED_PRODUCTS: Product[] = [
  base({
    id: "93dc8959-2586-405a-af9c-d9e0cbd39616",
    name: "Vestido Midi Canelado",
    description:
      "Vestido midi em malha canelada com toque macio e caimento que valoriza a silhueta. Versátil do dia à noite.",
    price: 189.9, compareAtPrice: 229.9, category: "feminino", stock: 24,
    sizes: ["P", "M", "G"], colors: [C.preto, C.vinho],
    images: ["/img/vestido-midi.jpg"], isNew: true, isBestSeller: true, age: 1,
  }),
  base({
    id: "5e0a6a21-7c7e-4f33-9b0e-2b5e1f0a1d01",
    name: "Conjunto Top e Legging",
    description: "Conjunto fitness de alta compressão com cintura alta e tecido que não marca. Ideal para treino e dia a dia.",
    price: 149.9, category: "fitness", stock: 30,
    sizes: ["P", "M", "G", "GG"], colors: [C.oliva, C.preto],
    images: ["/img/top-legging.jpg"], isNew: false, isBestSeller: true, age: 2,
  }),
  base({
    id: "48893915-f3d0-439c-a7ce-6436cd87cebb",
    name: "Bolsa Tote Couro Eco",
    description: "Bolsa tote espaçosa em couro ecológico, alças reforçadas e acabamento artesanal. Cabe notebook e o essencial do dia.",
    price: 129.9, category: "acessorios", stock: 12,
    sizes: ["Único"], colors: [C.caramelo],
    images: ["/img/bolsa-tote.jpg"], isNew: true, isBestSeller: false, age: 3,
  }),
  base({
    id: "b7d2c1a4-92f1-4a8e-8c55-0d1d3a7e2f02",
    name: "Conjunto Moletom Infantil",
    description: "Conjunto de moletom macio e confortável para as pequenas. Blusão e calça com elástico na cintura.",
    price: 89.9, category: "infantil", stock: 18,
    sizes: ["2", "4", "6"], colors: [C.rosa, C.azul],
    images: ["/img/moletom-infantil.jpg"], isNew: true, isBestSeller: false, age: 4,
  }),
  base({
    id: "c1f3a9d8-5b6e-4e2b-a0c4-7f8e9d0b1c03",
    name: "Camisa Oversized Linho",
    description: "Camisa oversized em linho leve, mangas amplas e toque fresco. Use aberta ou fechada, do trabalho à praia.",
    price: 159.9, category: "feminino", stock: 20,
    sizes: ["P", "M", "G"], colors: [C.branco, C.offwhite],
    images: ["/img/camisa-linho.jpg"], isNew: true, isBestSeller: true, age: 5,
  }),
  base({
    id: "d4e5f6a7-8b9c-4d0e-b1f2-a3b4c5d6e704",
    name: "Macacão Fitness",
    description: "Macacão fitness sem costura com modelagem que modela o corpo e liberdade total de movimento.",
    price: 199.9, compareAtPrice: 239.9, category: "fitness", stock: 15,
    sizes: ["P", "M", "G"], colors: [C.preto],
    images: ["/img/macacao-fitness.jpg"], isNew: false, isBestSeller: true, age: 6,
  }),
  base({
    id: "e8f9a0b1-c2d3-4e4f-95a6-b7c8d9e0f105",
    name: "Brinco Argola Dourada",
    description: "Par de argolas douradas banhadas, leves e elegantes. O toque final para qualquer look.",
    price: 39.9, category: "acessorios", stock: 40,
    sizes: ["Único"], colors: [C.dourado],
    images: ["/img/brinco-argola.jpg"], isNew: false, isBestSeller: false, age: 7,
  }),
  base({
    id: "f0a1b2c3-d4e5-4f6a-87b8-c9d0e1f2a306",
    name: "Vestido Infantil Floral",
    description: "Vestido infantil estampado floral com tecido leve e forro macio. Perfeito para festas e passeios.",
    price: 69.9, category: "infantil", stock: 22,
    sizes: ["2", "4", "6"], colors: [C.estampado],
    images: ["/img/vestido-infantil.jpg"], isNew: true, isBestSeller: false, age: 8,
  }),
];

export const DEFAULT_WHATSAPP = "5511999998888";
