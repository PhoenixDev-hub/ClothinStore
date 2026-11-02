import { Module } from '@nestjs/common';
import { AdminProductsController } from './admin-products.controller';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [
    ProductsController,
    AdminProductsController,
    CategoriesController,
  ],
  providers: [ProductsService, CategoriesService],
  exports: [ProductsService, CategoriesService],
})
export class ProductsModule {}
