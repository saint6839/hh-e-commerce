export class ProductDto {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly stock: number;

  constructor(id: number, name: string, price: number, stock: number) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
  }
}
