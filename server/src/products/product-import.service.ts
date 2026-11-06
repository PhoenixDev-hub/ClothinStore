import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parseCsv } from './csv';

const REQUIRED_COLUMNS = [
  'nome',
  'descrição',
  'preço',
  'categoria',
  'tamanho',
  'cor',
  'estoque',
  'imagem',
];

export interface ImportError {
  linha: number;
  motivo: string;
}

export interface ImportResult {
  criados: number;
  erros: ImportError[];
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const slugify = (value: string) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Converte "59.90", "59,90" ou "R$ 59,90" para centavos. */
function parsePrice(value: string): number | null {
  const clean = value.replace(/R\$/gi, '').replace(/\s/g, '');
  if (!clean) return null;

  const normalized = clean.includes(',')
    ? clean.replace(/\./g, '').replace(',', '.')
    : clean;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

const errorCode = (e: unknown) =>
  typeof e === 'object' && e !== null
    ? (e as { code?: string }).code
    : undefined;

@Injectable()
export class ProductImportService {
  constructor(private readonly prisma: PrismaService) {}

  async import(text: string): Promise<ImportResult> {
    const rows = parseCsv(text);
    const header = rows[0];
    if (!header) throw new BadRequestException('CSV vazio');

    const normalizedHeader = header.map(normalize);
    const missing = REQUIRED_COLUMNS.filter(
      (column) => !normalizedHeader.includes(normalize(column)),
    );
    if (missing.length) {
      throw new BadRequestException(
        `Colunas obrigatórias ausentes: ${missing.join(', ')}`,
      );
    }

    const column = (name: string) => normalizedHeader.indexOf(normalize(name));

    const categories = await this.prisma.category.findMany({
      select: { id: true, name: true, slug: true },
    });
    const categoryByName = new Map<string, number>();
    for (const category of categories) {
      categoryByName.set(normalize(category.name), category.id);
      categoryByName.set(normalize(category.slug), category.id);
    }

    const erros: ImportError[] = [];
    let criados = 0;

    for (let index = 1; index < rows.length; index++) {
      const row = rows[index];
      if (row.every((field) => !field.trim())) continue;

      const linha = index + 1;
      const cell = (name: string) => (row[column(name)] ?? '').trim();

      const name = cell('nome');
      const description = cell('descrição');
      const price = parsePrice(cell('preço'));
      const categoryName = cell('categoria');
      const size = cell('tamanho');
      const color = cell('cor');
      const stockValue = cell('estoque');
      const image = cell('imagem');

      const reason = this.validate({
        name,
        description,
        price,
        priceValue: cell('preço'),
        categoryName,
        size,
        color,
        stockValue,
        categoryByName,
      });
      if (reason) {
        erros.push({ linha, motivo: reason });
        continue;
      }

      const slug = slugify(name);
      const sku = `${slug}-${slugify(size)}-${slugify(color)}`.toUpperCase();
      const stock = stockValue ? Number(stockValue) : 0;

      try {
        await this.prisma.product.create({
          data: {
            name,
            slug,
            description,
            price: price as number,
            images: image ? [image] : [],
            categoryId: categoryByName.get(normalize(categoryName)) as number,
            status: ProductStatus.ACTIVE,
            variants: { create: [{ sku, size, color, stock }] },
          },
        });
        criados++;
      } catch (e) {
        if (errorCode(e) === 'P2002') {
          erros.push({
            linha,
            motivo: 'Produto com slug ou SKU já cadastrado',
          });
          continue;
        }
        throw e;
      }
    }

    return { criados, erros };
  }

  private validate(values: {
    name: string;
    description: string;
    price: number | null;
    priceValue: string;
    categoryName: string;
    size: string;
    color: string;
    stockValue: string;
    categoryByName: Map<string, number>;
  }): string | null {
    const {
      name,
      description,
      price,
      priceValue,
      categoryName,
      size,
      color,
      stockValue,
    } = values;

    if (!name) return 'Nome é obrigatório';
    if (!slugify(name)) return 'Nome inválido';
    if (!description) return 'Descrição é obrigatória';
    if (price === null) return `Preço "${priceValue}" inválido`;
    if (!categoryName) return 'Categoria é obrigatória';
    if (!values.categoryByName.has(normalize(categoryName))) {
      return `Categoria "${categoryName}" não encontrada`;
    }
    if (!size) return 'Tamanho é obrigatório';
    if (!color) return 'Cor é obrigatória';

    if (stockValue) {
      const stock = Number(stockValue);
      if (!Number.isInteger(stock) || stock < 0) {
        return `Estoque "${stockValue}" inválido`;
      }
    }

    return null;
  }
}
