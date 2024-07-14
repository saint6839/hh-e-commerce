import { PaymentEntity } from 'src/payment/infrastructure/entity/payment.entity';
import { EntityManager } from 'typeorm';

export const IPaymentRepositoryToken = Symbol('IPaymentRepository');

export interface IPaymentRepository {
  create(
    entity: PaymentEntity,
    entityManager?: EntityManager,
  ): Promise<PaymentEntity>;

  findById(
    id: number,
    entityManager?: EntityManager,
  ): Promise<PaymentEntity | null>;

  update(
    entity: PaymentEntity,
    entityManager?: EntityManager,
  ): Promise<PaymentEntity>;
}
