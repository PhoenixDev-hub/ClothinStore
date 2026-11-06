import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProductImportService } from './product-import.service';

const HEADER = 'nome,descrição,preço,categoria,tamanho,cor,estoque,imagem';

describe('ProductImportService', () => {
  let service: ProductImportService;
  let prisma: {
    category: { findMany: jest.Mock };
    product: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 1, name: 'Camisetas', slug: 'camisetas' }]),
      },
      product: { create: jest.fn().mockResolvedValue({ id: 1 }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductImportService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductImportService>(ProductImportService);
  });

  it('creates a product and one variant for a valid row', async () => {
    const csv = [
      HEADER,
      'Camiseta Básica,Camiseta de algodão,59.90,Camisetas,M,Branco,5,https://cdn/c.png',
    ].join('\n');

    const result = await service.import(csv);

    expect(result).toEqual({ criados: 1, erros: [] });
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: {
        name: 'Camiseta Básica',
        slug: 'camiseta-basica',
        description: 'Camiseta de algodão',
        price: 5990,
        images: ['https://cdn/c.png'],
        categoryId: 1,
        status: 'ACTIVE',
        variants: {
          create: [
            {
              sku: 'CAMISETA-BASICA-M-BRANCO',
              size: 'M',
              color: 'Branco',
              stock: 5,
            },
          ],
        },
      },
    });
  });

  it('accepts comma prices, empty stock and accented-less headers', async () => {
    const csv = [
      'nome,descricao,preco,categoria,tamanho,cor,estoque,imagem',
      'Calça,Jeans,"R$ 120,50",camisetas,40,Azul,,',
    ].join('\n');

    const result = await service.import(csv);

    expect(result).toEqual({ criados: 1, erros: [] });
    const [call] = prisma.product.create.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(call.data).toMatchObject({
      price: 12050,
      images: [],
      variants: { create: [{ stock: 0 }] },
    });
  });

  it('reports invalid rows and keeps importing the valid ones', async () => {
    const csv = [
      HEADER,
      'Camiseta,Camiseta de algodão,59.90,Camisetas,M,Branco,5,',
      'Preço inválido,Descrição,abc,Camisetas,M,Branco,5,',
      'Sem categoria,Descrição,10,Inexistente,M,Branco,5,',
      'Sem tamanho,Descrição,10,Camisetas,,Branco,5,',
    ].join('\n');

    const result = await service.import(csv);

    expect(result.criados).toBe(1);
    expect(result.erros).toEqual([
      { linha: 3, motivo: 'Preço "abc" inválido' },
      { linha: 4, motivo: 'Categoria "Inexistente" não encontrada' },
      { linha: 5, motivo: 'Tamanho é obrigatório' },
    ]);
  });

  it('rejects a CSV without the required columns', async () => {
    await expect(
      service.import('nome,preço\nCamiseta,10'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it('reports duplicate slugs/SKUs without aborting the import', async () => {
    prisma.product.create.mockRejectedValueOnce({ code: 'P2002' });
    const csv = [HEADER, 'Camiseta,Descrição,10,Camisetas,M,Branco,1,'].join(
      '\n',
    );

    const result = await service.import(csv);

    expect(result).toEqual({
      criados: 0,
      erros: [{ linha: 2, motivo: 'Produto com slug ou SKU já cadastrado' }],
    });
  });
});
