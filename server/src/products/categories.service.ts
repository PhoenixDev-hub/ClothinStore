import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { LIST_VERSION_KEY } from './products.cache';

const errorCode = (e: unknown) =>
  typeof e === 'object' && e !== null
    ? (e as { code?: string }).code
    : undefined;

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: dto });
    } catch (e) {
      if (errorCode(e) === 'P2002') {
        throw new ConflictException(`Slug "${dto.slug}" já está em uso`);
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateCategoryDto) {
    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: dto,
      });
      await this.cache.set(LIST_VERSION_KEY, Date.now(), 0);
      return category;
    } catch (e) {
      if (errorCode(e) === 'P2025') {
        throw new NotFoundException(`Categoria ${id} não encontrada`);
      }
      if (errorCode(e) === 'P2002') {
        throw new ConflictException(`Slug "${dto.slug}" já está em uso`);
      }
      throw e;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.category.delete({ where: { id } });
      await this.cache.set(LIST_VERSION_KEY, Date.now(), 0);
      return { deleted: true, id };
    } catch (e) {
      if (errorCode(e) === 'P2025') {
        throw new NotFoundException(`Categoria ${id} não encontrada`);
      }
      if (errorCode(e) === 'P2003') {
        throw new ConflictException(
          'Categoria possui produtos; mova ou remova-os antes',
        );
      }
      throw e;
    }
  }
}
