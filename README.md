# Milestone

![alt text](docs/images/milestone.png)

# E-Commerce Sequence Diagram

### 💰잔액 API

**잔액 충전 API**

```mermaid
sequenceDiagram
  Controller ->> ChargeUserUseCase: 사용자 잔액 충전 요청 (userId, amount)
  ChargeUserUseCase ->> Database: 사용자 잔액 충전 쿼리
  Database -->> ChargeUserUseCase: 사용자 데이터 반환
  ChargeUserUseCase -->> Controller: 사용자 데이터 반환
```

**잔액 조회 API**

```mermaid
sequenceDiagram
  Controller ->> ReadUserUseCase: 사용자 조회 요청 (userId)
  ReadUserUseCase ->> Database: 사용자 조회 쿼리
  Database -->> ReadUserUseCase: 사용자 데이터 반환
  ReadUserUseCase -->> Controller: 사용자 데이터 반환
```

### 📱상품 조회 API

**전체 상품 조회**

```mermaid
sequenceDiagram
  Controller ->> BrowseProductsUseCase: 전체 상품 조회 요청
  BrowseProductsUseCase ->> Database: 전체 상품 조회 쿼리
  Database -->> BrowseProductsUseCase: 전체 상품 데이터 반환
  BrowseProductsUseCase -->> Controller: 전체 상품 데이터 반환
```

**특정 상품 조회**

```mermaid
sequenceDiagram
  Controller ->> ReadProductUseCase: 단건 상품 조회 요청 (productId)
  ReadProductUseCase ->> Database: 단건 상품 조회 쿼리
  Database -->> ReadProductUseCase: 단건 상품 데이터 반환
  ReadProductUseCase -->> Controller: 단건 상품 데이터 반환
```

**상위 상품 조회**

```mermaid
sequenceDiagram
  Controller ->> BrowsePopularProductsFacadeUseCase: 특정 기간 동안의 상위 상품 조회 요청(from, to)
  BrowsePopularProductsFacadeUseCase ->> Database: 특정 기간 동안의 판매량 상위 5개 항목 조회 쿼리
  Database -->> BrowsePopularProductsFacadeUseCase: 조회 데이터 반환
  BrowsePopularProductsFacadeUseCase ->> ReadProductUseCase: 조회된 상위 상품의 상세 정보 조회 요청
  ReadProductUseCase -->> BrowsePopularProductsFacadeUseCase: 각 상품 데이터 상세정보 조회 결과 반환
  BrowsePopularProductsFacadeUseCase -->> Controller: 결과 반환
```

### 💸주문 / 결제 API

#### 주문 생성

```mermaid
sequenceDiagram
    Client->>OrderController: POST /api/v1/orders (CreateOrderFacadeDto)
    OrderController->>CreateOrderFacadeUseCase: execute(CreateOrderFacadeDto)
    CreateOrderFacadeUseCase->>DataSource: transaction 시작
    loop 각 상품 옵션에 대해
        CreateOrderFacadeUseCase->>DecreaseProductStockUseCase: execute(DecreaseProductStockDto)
        DecreaseProductStockUseCase-->>CreateOrderFacadeUseCase: 재고 감소 결과
    end
    CreateOrderFacadeUseCase->>CreateOrderUseCase: execute(CreateOrderFacadeDto)
    CreateOrderUseCase-->>CreateOrderFacadeUseCase: OrderDto
    CreateOrderFacadeUseCase->>CreatePaymentUseCase: execute(PaymentDto)
    CreatePaymentUseCase-->>CreateOrderFacadeUseCase: 결제 초기 데이터 생성 결과
    CreateOrderFacadeUseCase->>EventEmitter: emit('order.created', {orderId})
    DataSource-->>CreateOrderFacadeUseCase: transaction 완료
    CreateOrderFacadeUseCase-->>OrderController: OrderDto
    OrderController-->>Client: 201 Created (OrderDto)
```

#### 결제 처리

```mermaid
sequenceDiagram
    Controller->>CompletePaymentFacadeUseCase: execute(CompletePaymentFacadeDto)
    CompletePaymentFacadeUseCase->>DataSource: transaction 시작
    DataSource-->>CompletePaymentFacadeUseCase: EntityManager 제공
    CompletePaymentFacadeUseCase->>Database: 결제 정보 조회
    Database-->>CompletePaymentFacadeUseCase: PaymentEntity 반환
    CompletePaymentFacadeUseCase->>Database: 주문 정보 조회
    Database-->>CompletePaymentFacadeUseCase: OrderEntity 반환
    CompletePaymentFacadeUseCase->>Database: 주문 항목 조회
    Database-->>CompletePaymentFacadeUseCase: OrderItemEntity[] 반환
    CompletePaymentFacadeUseCase->>AccumulatePopularProductsSoldUseCase: execute(AccumulatePopularProductsSoldDto)
    AccumulatePopularProductsSoldUseCase->>Database: 인기 상품 판매량 누적
    Database-->>AccumulatePopularProductsSoldUseCase: 누적 완료
    AccumulatePopularProductsSoldUseCase-->>CompletePaymentFacadeUseCase: 실행 완료
    CompletePaymentFacadeUseCase->>SpendUserBalanceUsecase: execute(SpendBalanceDto)
    SpendUserBalanceUsecase->>Database: 사용자 잔액 차감
    Database-->>SpendUserBalanceUsecase: 차감 완료
    SpendUserBalanceUsecase-->>CompletePaymentFacadeUseCase: 실행 완료
    CompletePaymentFacadeUseCase->>CompletePaymentUseCase: execute(CompletePaymentDto)
    CompletePaymentUseCase->>Database: 결제 완료 처리
    Database-->>CompletePaymentUseCase: 처리 완료
    CompletePaymentUseCase-->>CompletePaymentFacadeUseCase: PaymentResultDto 반환
    alt 트랜잭션 성공
        DataSource-->>CompletePaymentFacadeUseCase: 트랜잭션 커밋
        CompletePaymentFacadeUseCase-->>Controller: PaymentResultDto 반환
    else 트랜잭션 실패
        DataSource-->>CompletePaymentFacadeUseCase: 트랜잭션 롤백
        CompletePaymentFacadeUseCase->>Database: 결제 실패 상태 업데이트
        CompletePaymentFacadeUseCase->>Database: 주문 취소 상태 업데이트
        CompletePaymentFacadeUseCase-->>Controller: 에러 throw
    end
```

### 🛒장바구니 API

**장바구니 상품 추가 API**

```mermaid
sequenceDiagram
    Controller->>AddCartUseCase: execute(AddCartProductDetailDto)
    AddCartUseCase->>Database: 상품 옵션 조회 (productOptionId)
    Database-->>AddCartUseCase: ProductOptionEntity 반환
    alt 상품 옵션이 존재하지 않는 경우
        AddCartUseCase-->>Controller: NOT_FOUND_PRODUCT_OPTION_ERROR 발생
    else 상품 옵션이 존재하는 경우
        AddCartUseCase->>Database: 장바구니 항목 생성 (userId, productOptionId, quantity)
        Database-->>AddCartUseCase: 생성된 CartEntity 반환
        AddCartUseCase->>AddCartUseCase: CartDto 생성
        AddCartUseCase-->>Controller: CartDto 반환
    end
```

**장바구니 상품 삭제 API**

```mermaid
sequenceDiagram
    Controller->>DeleteCartUseCase: execute(cartId)
    DeleteCartUseCase->>Database: 장바구니 항목 삭제 (cartId)
    Database-->>DeleteCartUseCase: 삭제 결과 반환
    DeleteCartUseCase-->>Controller: void (삭제 완료)
```

**장바구니 상품 조회 API**

```mermaid
sequenceDiagram
    Controller->>BrowseCartUseCase: execute(userId)
    BrowseCartUseCase->>Database: 사용자의 장바구니 항목 조회 (userId)
    Database-->>BrowseCartUseCase: 장바구니 항목 반환
    alt 장바구니가 비어있는 경우
        BrowseCartUseCase-->>Controller: 빈 배열 반환
    else 장바구니에 항목이 있는 경우
        BrowseCartUseCase->>Database: 상품 옵션 정보 조회 (productOptionIds)
        Database-->>BrowseCartUseCase: 상품 옵션 정보 반환
        loop 각 장바구니 항목에 대해
            BrowseCartUseCase->>BrowseCartUseCase: CartDto 생성
        end
        BrowseCartUseCase-->>Controller: CartDto 배열 반환
    end
```

# E-commerce ERDiagram

```mermaid
erDiagram
  users {
    long id
    varchar name
    int balance
    datetime deletedAt
  }

  products {
    long id
    varchar name
    enum status
    datetime deletedAt
  }

  orders {
    long id
    long userId
    long totalPrice
    enum status
    datetime orderedAt
    datetime deletedAt
  }

  order_items {
    long id
    long orderId
    long productOptionId
    varchar productName
    int quantity
    long totalPriceAtOrder
    datetime deletedAt
  }

  payments {
    long id
    long userId
    long orderId
    long amount
    enum paymentMethod
    enum status
    datetime paidAt
    datetime deletedAt
  }

  carts {
    long id
    long userId
    long productOptionId
    int quantity
    datetime deletedAt
  }

  daily_popular_products {
    long id
    long productId
    long productOptionId
    int totalSold
    date soldDate
    datetime updatedAt
  }

  users ||--|| carts : "has"
  users ||--o{ orders : "has"
  orders ||--o{ order_items : "contains"
  products ||--o{ order_items : "is in"

  products ||--o{ daily_popular_products : "is"
  orders ||--|| payments : "has"
```
