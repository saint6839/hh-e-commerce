import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from 'src/product/product.module';
import { ICartRepositoryToken } from './domain/interface/repository/cart.repository.interface';
import { IAddCartUseCaseToken } from './domain/interface/usecase/add-cart.usecase.interface';
import { IDeleteCartUsecaseToken } from './domain/interface/usecase/delete-cart.usecase.interface';
import { CartEntity } from './infrastructure/entity/cart.entity';
import { CartRepository } from './infrastructure/repository/cart.repository';
import { CartController } from './presentation/controller/cart.controller';
import { AddCartUseCase } from './usecase/add-cart.usecase';
import { DeleteCartUseCase } from './usecase/delete-cart.usecase';

@Module({
  imports: [ProductModule, TypeOrmModule.forFeature([CartEntity])],
  controllers: [CartController],
  providers: [
    { provide: ICartRepositoryToken, useClass: CartRepository },
    {
      provide: IAddCartUseCaseToken,
      useClass: AddCartUseCase,
    },
    {
      provide: IDeleteCartUsecaseToken,
      useClass: DeleteCartUseCase,
    },
  ],
})
export class CartModule {}
