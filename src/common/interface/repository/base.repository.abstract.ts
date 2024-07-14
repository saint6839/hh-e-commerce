import { EntityManager, ObjectLiteral, Repository } from 'typeorm';

/**
 * 기본 리포지토리 추상 클래스
 *
 * 이 클래스는 EntityManager를 사용한 트랜잭션 처리와 일반 쿼리 실행을 모두 지원하는
 * 리포지토리의 기본 구조를 제공합니다.
 *
 * @typeParam T - 리포지토리가 다루는 엔티티의 타입
 */
export abstract class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * 주어진 operation을 실행합니다. EntityManager가 제공되면 트랜잭션 내에서 실행하고,
   * 그렇지 않으면 일반 리포지토리에서 실행합니다.
   *
   * @param operation - 실행할 데이터베이스 작업
   * @param entityManager - 선택적으로 제공되는 EntityManager 인스턴스
   * @returns 데이터베이스 작업의 결과
   *
   * @typeParam R - 데이터베이스 작업의 반환 타입
   */
  protected async executeQuery<R>(
    operation: (repo: Repository<T>) => Promise<R>,
    entityManager?: EntityManager,
  ): Promise<R> {
    if (entityManager) {
      const repo = entityManager.getRepository<T>(this.repository.target);
      return operation(repo);
    }
    return operation(this.repository);
  }
}
