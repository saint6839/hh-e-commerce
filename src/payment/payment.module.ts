import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { OrderModule } from 'src/order/order.module';
import { ProductModule } from 'src/product/product.module';
import { UserModule } from 'src/user/user.module';
import { IPaymentRepositoryToken } from './domain/interface/repository/payment.repository.interface';
import { IPaymentGatewayServiceToken } from './domain/interface/service/payment-gateway.service.interface';
import { ICompletePaymentFacadeUseCaseToken } from './domain/interface/usecase/complete-payment-facade.usecase.interface';
import { ICompletePaymentUseCaseToken } from './domain/interface/usecase/complete-payment.usecase.interface';
import { ICreatePaymentUseCaseToken } from './domain/interface/usecase/create-payment.usecase.interface';
import { PaymentEntity } from './infrastructure/entity/payment.entity';
import { PaymentRepository } from './infrastructure/repository/payment.repository';
import { PaymentGatewayService } from './infrastructure/service/payment-gateway.service';
import { PaymentCompletedListener } from './listener/payment-completed.listener';
import { PaymentController } from './presentation/controller/payment.controller';
import { CompletePaymentFacadeUseCase } from './usecase/complete-payment-facade.usecase';
import { CompletePaymentUseCase } from './usecase/complete-payment.usecase';
import { CreatePaymentUseCase } from './usecase/create-payment.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity]),
    ProductModule,
    UserModule,
    forwardRef(() => OrderModule),
    CqrsModule,
  ],
  exports: [ICreatePaymentUseCaseToken],
  controllers: [PaymentController],
  providers: [
    {
      provide: IPaymentRepositoryToken,
      useClass: PaymentRepository,
    },
    {
      provide: ICreatePaymentUseCaseToken,
      useClass: CreatePaymentUseCase,
    },
    {
      provide: IPaymentGatewayServiceToken,
      useClass: PaymentGatewayService,
    },
    {
      provide: ICompletePaymentUseCaseToken,
      useClass: CompletePaymentUseCase,
    },
    {
      provide: ICompletePaymentFacadeUseCaseToken,
      useClass: CompletePaymentFacadeUseCase,
    },
    LoggerService,
    PaymentCompletedListener,
  ],
})
export class PaymentModule {}
