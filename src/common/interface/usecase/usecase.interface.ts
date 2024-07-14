import { EntityManager } from 'typeorm';
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput, entityManager?: EntityManager): Promise<TOutput>;
}
