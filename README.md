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
  Controller ->> PopularProductsFacadeUseCase: 상위 상품 조회 요청 (기간: 최근 3일)
  PopularProductsFacadeUseCase ->> GetOrdersUseCase: 최근 3일간 주문 데이터 조회 요청
  GetOrdersUseCase ->> Database: 최근 3일간 주문 데이터 조회 쿼리
  Database -->> GetOrdersUseCase: 주문 데이터 반환
  GetOrdersUseCase -->> PopularProductsFacadeUseCase: 주문 데이터 반환

  PopularProductsFacadeUseCase ->> AggregateProductSalesUseCase: 주문 데이터 집계 요청
  AggregateProductSalesUseCase ->> Database: 주문 데이터 기반 상품 판매량 집계 쿼리
  Database -->> AggregateProductSalesUseCase: 집계된 상품 판매량 데이터 반환
  AggregateProductSalesUseCase -->> PopularProductsFacadeUseCase: 집계된 상품 판매량 데이터 반환

  PopularProductsFacadeUseCase ->> GetProductDetailsUseCase: 상위 5개 상품 정보 요청
  GetProductDetailsUseCase ->> Database: 상위 5개 상품 정보 조회 쿼리
  Database -->> GetProductDetailsUseCase: 상위 5개 상품 정보 반환
  GetProductDetailsUseCase -->> PopularProductsFacadeUseCase: 상위 5개 상품 정보 반환

  PopularProductsFacadeUseCase -->> Controller: 상위 5개 상품 정보 반환
```

### 💸주문 / 결제 API

```mermaid
sequenceDiagram
  Controller ->> OrderPaymentFacadeUseCase: 주문 / 결제 요청 (userId, 상품 목록)
  OrderPaymentFacadeUseCase ->> ValidateStockUseCase: 상품 재고 확인 요청 (상품 목록)
  ValidateStockUseCase ->> Database: 상품 재고 조회 쿼리
  Database -->> ValidateStockUseCase: 상품 재고 데이터 반환
  ValidateStockUseCase -->> OrderPaymentFacadeUseCase: 재고 확인 결과 반환

  alt 재고 충분함
    OrderPaymentFacadeUseCase ->> ValidateBalanceUseCase: 사용자 잔액 확인 요청 (userId, 총 금액)
    ValidateBalanceUseCase ->> Database: 사용자 잔액 조회 쿼리
    Database -->> ValidateBalanceUseCase: 사용자 잔액 데이터 반환
    ValidateBalanceUseCase -->> OrderPaymentFacadeUseCase: 잔액 확인 결과 반환

    alt 잔액 충분함
      OrderPaymentFacadeUseCase ->> DeductBalanceUseCase: 사용자 잔액 차감 요청 (userId, 총 금액)
      DeductBalanceUseCase ->> Database: 사용자 잔액 차감 쿼리
      Database -->> DeductBalanceUseCase: 잔액 차감 결과 반환
      DeductBalanceUseCase -->> OrderPaymentFacadeUseCase: 잔액 차감 완료

      OrderPaymentFacadeUseCase ->> PlaceOrderUseCase: 주문 생성 요청 (userId, 상품 목록)
      PlaceOrderUseCase ->> Database: 주문 생성 쿼리
      Database -->> PlaceOrderUseCase: 주문 생성 결과 반환
      PlaceOrderUseCase -->> OrderPaymentFacadeUseCase: 주문 생성 완료

      OrderPaymentFacadeUseCase ->> ExternalDataPlatform: 주문 데이터 전송
      ExternalDataPlatform -->> OrderPaymentFacadeUseCase: 데이터 전송 확인

      OrderPaymentFacadeUseCase -->> Controller: 주문 / 결제 완료 반환
    else 잔액 부족
      OrderPaymentFacadeUseCase -->> Controller: 잔액 부족 오류 반환
    end
  else 재고 부족
    OrderPaymentFacadeUseCase -->> Controller: 재고 부족 오류 반환
  end
```

### 🛒장바구니 API

**장바구니 상품 추가 API**

```mermaid
sequenceDiagram
  Controller ->> AddToCartUseCase: 장바구니에 상품 추가 요청 (userId, productId, quantity)
  AddToCartUseCase ->> Database: 사용자 장바구니 조회 쿼리 (userId)
  Database -->> AddToCartUseCase: 장바구니 데이터 반환
  alt 장바구니에 상품이 이미 있는 경우
    AddToCartUseCase ->> Database: 장바구니 항목 업데이트 쿼리 (cartId, productId, quantity)
  else 장바구니에 상품이 없는 경우
    AddToCartUseCase ->> Database: 장바구니에 상품 추가 쿼리 (cartId, productId, quantity)
  end
  Database -->> AddToCartUseCase: 장바구니 업데이트 결과 반환
  AddToCartUseCase -->> Controller: 장바구니 업데이트 완료 반환

```

**장바구니 상품 삭제 API**

```mermaid
sequenceDiagram
  Controller ->> RemoveFromCartUseCase: 장바구니에서 상품 삭제 요청 (userId, productId)
  RemoveFromCartUseCase ->> Database: 사용자 장바구니 조회 쿼리 (userId)
  Database -->> RemoveFromCartUseCase: 장바구니 데이터 반환
  alt 장바구니에 상품이 있는 경우
    RemoveFromCartUseCase ->> Database: 장바구니에서 상품 삭제 쿼리 (cartId, productId)
    Database -->> RemoveFromCartUseCase: 장바구니 업데이트 결과 반환
    RemoveFromCartUseCase -->> Controller: 장바구니 업데이트 완료 반환
  else 장바구니에 상품이 없는 경우
    RemoveFromCartUseCase -->> Controller: 상품이 장바구니에 없음 오류 반환
  end
```

**장바구니 상품 조회 API**

```mermaid
sequenceDiagram
  Controller ->> ViewCartFacadeUseCase: 장바구니 조회 요청 (userId)
  ViewCartFacadeUseCase ->> BrowseCartItemsUseCase: 장바구니 항목 조회 요청 (userId)
  BrowseCartItemsUseCase ->> Database: 사용자 장바구니 항목 조회 쿼리 (userId)
  Database -->> BrowseCartItemsUseCase: 장바구니 항목 데이터 반환 (cartItems)
  BrowseCartItemsUseCase -->> ViewCartFacadeUseCase: 장바구니 항목 데이터 반환

  ViewCartFacadeUseCase ->> BrowseProductsUseCase: 상품 상세 정보 조회 요청 (productIds)
  BrowseProductsUseCase ->> Database: 상품 상세 정보 조회 쿼리 (productIds)
  Database -->> BrowseProductsUseCase: 상품 상세 정보 반환
  BrowseProductsUseCase -->> ViewCartFacadeUseCase: 상품 상세 정보 반환

  ViewCartFacadeUseCase -->> Controller: 장바구니 상세 정보 반환
```
