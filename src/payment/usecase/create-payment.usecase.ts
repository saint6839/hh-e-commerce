import { Inject, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  IPaymentRepository,
  IPaymentRepositoryToken,
} from '../domain/interface/repository/payment.repository.interface';
import { ICreatePaymentUseCase } from '../domain/interface/usecase/create-payment.usecase.interface';
import { PaymentEntity } from '../infrastructure/entity/payment.entity';
import { PaymentDto } from '../presentation/dto/request/payment.dto';
import { PaymentResultDto } from '../presentation/dto/response/payment-result.dto';

@Injectable()
export class CreatePaymentUseCase implements ICreatePaymentUseCase {
  constructor(
    @Inject(IPaymentRepositoryToken)
    private readonly paymentRepository: IPaymentRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    dto: PaymentDto,
    entityManager?: EntityManager,
  ): Promise<PaymentResultDto> {
    const transactionCallback = async (entityManager: EntityManager) => {
      const paymentEntity = await this.paymentRepository.create(
        PaymentEntity.of(dto.userId, dto.orderId, dto.amount),
        entityManager,
      );

      return new PaymentResultDto(
        paymentEntity.id,
        paymentEntity.userId,
        paymentEntity.orderId,
        paymentEntity.amount,
        paymentEntity.status,
        paymentEntity.paymentMethod,
        paymentEntity.paidAt,
      );
    };

    if (entityManager) {
      return transactionCallback(entityManager);
    }
    return this.dataSource.transaction(transactionCallback);
  }
}
