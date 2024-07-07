export enum OrderStatus {
  CREATED = '생성됨',
  PENDING_PAYMENT = '결제 대기중',
  PAID = '결제 완료',
  PREPARING = '상품 준비중',
  SHIPPED = '배송중',
  DELIVERED = '배송 완료',
  CANCELLED = '주문 취소',
  REFUNDED = '환불 완료',
}
