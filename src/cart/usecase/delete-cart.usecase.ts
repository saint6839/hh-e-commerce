import { Inject, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  ICartRepository,
  ICartRepositoryToken,
} from '../domain/interface/repository/cart.repository.interface';
import { IDeleteCartUsecase } from '../domain/interface/usecase/delete-cart.usecase.interface';

@Injectable()
export class DeleteCartUseCase implements IDeleteCartUsecase {
  constructor(
    @Inject(ICartRepositoryToken)
    private readonly cartRepository: ICartRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(cartId: number, entityManager?: EntityManager): Promise<void> {
    const transactionCallback = async (
      transactionalEntityManager: EntityManager,
    ) => {
      await this.cartRepository.delete(cartId, transactionalEntityManager);
    };

    if (entityManager) {
      await transactionCallback(entityManager);
    } else {
      await this.dataSource.transaction(transactionCallback);
    }
  }
}
