import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '../generated/prisma/client';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginatedResult } from './interfaces/paginated-result.interface';
import { CACHE_TTL_MS, LIST_VERSION_KEY, slugKey } from './products.cache';

const include = {
  category: { select: { id: true, name: true, slug: true } },
  variants: { orderBy: [{ color: 'asc' }, { size: 'asc' }] },
} satisfies Prisma.ProductInclude;

const errorCode = (e: unknown) =>
  typeof e === 'object' && e !== null
    ? (e as { code?: string }).code
    : undefined;

function withStock<
  T extends { variants: { stock: number; available: boolean }[] },
>(product: T) {
  const totalStock = product.variants
    .filter((v) => v.available)
    .reduce((sum, v) => sum + v.stock, 0);
  return { ...product, totalStock, inStock: totalStock > 0 };
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(query: QueryProductsDto) {
    const version = (await this.cache.get<number>(LIST_VERSION_KEY)) ?? 0;
    const cacheKey = `products:list:v${version}:${JSON.stringify(query)}`;

    const cached = await this.cache.get<PaginatedResult<unknown>>(cacheKey);
    if (cached) return cached;

    const { page, limit } = query;
    const where = this.buildWhere(query);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const result = {
      data: rows.map(withStock),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
    await this.cache.set(cacheKey, result, CACHE_TTL_MS);
    return result;
  }

  async findOne(slug: string) {
    const cached = await this.cache.get<unknown>(slugKey(slug));
    if (cached) return cached;

    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.ACTIVE },
      include,
    });
    if (!product) {
      throw new NotFoundException(`Produto "${slug}" não encontrado`);
    }

    const result = withStock(product);
    await this.cache.set(slugKey(slug), result, CACHE_TTL_MS);
    return result;
  }

  async create(dto: CreateProductDto) {
    const { variants, ...data } = dto;
    try {
      const product = await this.prisma.product.create({
        data: {
          ...data,
          ...(variants?.length ? { variants: { create: variants } } : {}),
        },
        include,
      });
      await this.invalidate();
      return withStock(product);
    } catch (e) {
      this.handleWriteError(e, dto);
    }
  }

  async update(id: number, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { slug: true },
    });
    if (!existing) throw new NotFoundException(`Produto ${id} não encontrado`);

    const { variants, ...data } = dto;
    try {
      const update = this.prisma.product.update({
        where: { id },
        data: {
          ...data,
          ...(variants ? { variants: { create: variants } } : {}),
        },
        include,
      });

      const product = variants
        ? (
            await this.prisma.$transaction([
              this.prisma.variant.deleteMany({ where: { productId: id } }),
              update,
            ])
          )[1]
        : await update;

      await this.invalidate(existing.slug, product.slug);
      return withStock(product);
    } catch (e) {
      this.handleWriteError(e, dto);
    }
  }

  async remove(id: number) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { slug: true },
    });
    if (!existing) throw new NotFoundException(`Produto ${id} não encontrado`);

    await this.prisma.product.delete({ where: { id } });
    await this.invalidate(existing.slug);
    return { deleted: true, id };
  }

  private buildWhere(q: QueryProductsDto): Prisma.ProductWhereInput {
    const variantFilter: Prisma.VariantWhereInput = {
      ...(q.size ? { size: q.size } : {}),
      ...(q.color ? { color: q.color } : {}),
      ...(q.inStock ? { available: true, stock: { gt: 0 } } : {}),
    };

    return {
      status: q.status ?? ProductStatus.ACTIVE,
      ...(q.category
        ? {
            category: {
              OR: [{ slug: q.category }, { parent: { slug: q.category } }],
            },
          }
        : {}),
      ...(Object.keys(variantFilter).length
        ? { variants: { some: variantFilter } }
        : {}),
      ...(q.minPrice !== undefined || q.maxPrice !== undefined
        ? { price: { gte: q.minPrice, lte: q.maxPrice } }
        : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { brand: { contains: q.search, mode: 'insensitive' } },
              { tags: { has: q.search.toLowerCase() } },
            ],
          }
        : {}),
    };
  }

  private handleWriteError(e: unknown, dto: Partial<CreateProductDto>): never {
    const code = errorCode(e);
    if (code === 'P2002') {
      throw new ConflictException(
        `Já existe produto com este slug ("${dto.slug ?? ''}") ou variante com SKU/tamanho/cor repetidos`,
      );
    }
    if (code === 'P2003') {
      throw new BadRequestException('categoryId não existe');
    }
    throw e;
  }

  private async invalidate(...slugs: string[]) {
    await this.cache.set(LIST_VERSION_KEY, Date.now(), 0);
    await Promise.all(
      [...new Set(slugs)].map((s) => this.cache.del(slugKey(s))),
    );
  }
}
