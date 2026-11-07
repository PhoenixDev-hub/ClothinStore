import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProductImportService } from './product-import.service';

const HEADER = 'nome,descrição,preço,categoria,tamanho,cor,estoque,imagem,sku';

describe('ProductImportService', () => {
  let service: ProductImportService;
  let prisma: {
    category: { findMany: jest.Mock };
    variant: { findUnique: jest.Mock };
    product: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 1, name: 'Camisetas', slug: 'cam' }]),
      },
      variant: { findUnique: jest.fn().mockResolvedValue(null) },
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
      'Camiseta Básica,Camiseta de algodão,59.90,Camisetas,M,Branco,5,https://cdn/c.png,',
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
        isNew: true,
        variants: {
          create: [
            {
              sku: 'CAM-CAMISETA-BASICA-BRANCO-M',
              size: 'M',
              color: 'Branco',
              stock: 5,
            },
          ],
        },
      },
    });
  });

  it('respects a manually supplied SKU in the CSV', async () => {
    const csv = [
      HEADER,
      'Camiseta Básica,Descrição,59.90,Camisetas,M,Branco,5,,MANUAL-001',
    ].join('\n');

    await service.import(csv);

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          variants: {
            create: [expect.objectContaining({ sku: 'MANUAL-001' })],
          },
        }) as unknown,
      }),
    );
  });

  it('generates a SKU when the CSV header omits the optional SKU column', async () => {
    const csv = [
      'nome,descrição,preço,categoria,tamanho,cor,estoque,imagem',
      'Camiseta Básica,Descrição,59.90,Camisetas,M,Branco,5,',
    ].join('\n');

    await service.import(csv);

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          variants: {
            create: [
              expect.objectContaining({ sku: 'CAM-CAMISETA-BASICA-BRANCO-M' }),
            ],
          },
        }) as unknown,
      }),
    );
  });

  it('adds the first available numeric suffix when an automatic SKU is taken', async () => {
    prisma.variant.findUnique
      .mockResolvedValueOnce({ sku: 'CAM-CAMISETA-BASICA-BRANCO-M' })
      .mockResolvedValueOnce({ sku: 'CAM-CAMISETA-BASICA-BRANCO-M-2' })
      .mockResolvedValueOnce(null);
    const csv = [
      HEADER,
      'Camiseta Básica,Descrição,59.90,Camisetas,M,Branco,5,,',
    ].join('\n');

    await service.import(csv);

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          variants: {
            create: [
              expect.objectContaining({
                sku: 'CAM-CAMISETA-BASICA-BRANCO-M-3',
              }),
            ],
          },
        }) as unknown,
      }),
    );
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
