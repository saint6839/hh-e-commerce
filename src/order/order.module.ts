import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { PaymentModule } from 'src/payment/payment.module';
import { ProductModule } from 'src/product/product.module';
import { IOrderItemRepositoryToken } from './domain/interface/repository/order-item.repository.interface';
import { IOrderRepositoryToken } from './domain/interface/repository/order.repository.interface';
import { ICancelOrderUseCaseToken } from './domain/interface/usecase/cancel-order.usecase.interface';
import { ICreateOrderFacadeUseCaseToken } from './domain/interface/usecase/create-order-facade.usecase.interface';
import { ICreateOrderUseCaseToken } from './domain/interface/usecase/create-order.uscase.interface';
import { OrderEventListener } from './listener/order-event.listener';
import { OrderController } from './presentation/controller/order.controller';
import { OrderItemEntity } from './repository/entity/order-item.entity';
import { OrderEntity } from './repository/entity/order.entity';
import { OrderItemRepository } from './repository/repository/order-item.repository';
import { OrderRepository } from './repository/repository/order.repository';
import { CancelOrderUseCase } from './usecase/cancel-order.usecase';
import { CreateOrderFacadeUseCase } from './usecase/create-order-facade.usecase';
import { CreateOrderUseCase } from './usecase/create-order.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity]),
    ProductModule,
    PaymentModule,
    EventEmitterModule.forRoot(),
  ],
  exports: [IOrderRepositoryToken, IOrderItemRepositoryToken],
  controllers: [OrderController],
  providers: [
    {
      provide: IOrderRepositoryToken,
      useClass: OrderRepository,
    },
    {
      provide: IOrderItemRepositoryToken,
      useClass: OrderItemRepository,
    },
    {
      provide: ICreateOrderFacadeUseCaseToken,
      useClass: CreateOrderFacadeUseCase,
    },
    {
      provide: ICancelOrderUseCaseToken,
      useClass: CancelOrderUseCase,
    },
    {
      provide: ICreateOrderUseCaseToken,
      useClass: CreateOrderUseCase,
    },
    LoggerService,
    OrderEventListener,
  ],
})
export class OrderModule {}
