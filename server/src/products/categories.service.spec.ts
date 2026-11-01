import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

jest.mock('@nestjs/cache-manager', () => ({
  CACHE_MANAGER: 'CACHE_MANAGER',
}));

describe('CategoriesService.update', () => {
  let service: CategoriesService;
  let prisma: {
    category: { findUnique: jest.Mock; update: jest.Mock };
  };
  let cache: { set: jest.Mock };

  beforeEach(async () => {
    prisma = {
      category: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    cache = { set: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('rejects making a category a child of itself', async () => {
    await expect(service.update(1, { parentId: 1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.category.update).not.toHaveBeenCalled();
  });

  it('rejects a parent chain that loops back to the category', async () => {
    prisma.category.findUnique
      .mockResolvedValueOnce({ parentId: 3 })
      .mockResolvedValueOnce({ parentId: 1 });

    await expect(service.update(1, { parentId: 2 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.category.update).not.toHaveBeenCalled();
  });

  it('allows a parent outside the category subtree', async () => {
    prisma.category.findUnique.mockResolvedValueOnce({ parentId: null });
    prisma.category.update.mockResolvedValue({ id: 1, parentId: 2 });

    await expect(service.update(1, { parentId: 2 })).resolves.toEqual({
      id: 1,
      parentId: 2,
    });
  });
});
