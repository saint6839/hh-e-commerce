import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/common/interface/repository/base.repository.abstract';
import { IPaymentRepository } from 'src/payment/domain/interface/repository/payment.repository.interface';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { PaymentEntity } from '../entity/payment.entity';

@Injectable()
export class PaymentRepository
  extends BaseRepository<PaymentEntity>
  implements IPaymentRepository
{
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {
    super(paymentRepository);
  }
  update(
    entity: PaymentEntity,
    entityManager?: EntityManager,
  ): Promise<PaymentEntity> {
    return this.executeQuery(
      async (repo) => await repo.save(entity),
      entityManager,
    );
  }

  async findById(
    id: number,
    entityManager?: EntityManager,
  ): Promise<PaymentEntity | null> {
    return this.executeQuery(
      (repo) => repo.findOne({ where: { id, deletedAt: IsNull() } }),
      entityManager,
    );
  }

  async create(
    entity: PaymentEntity,
    entityManager?: EntityManager,
  ): Promise<PaymentEntity> {
    return this.executeQuery(
      async (repo) => await repo.save(entity),
      entityManager,
    );
  }
}
