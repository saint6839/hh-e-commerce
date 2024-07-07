import { ProductEntity } from 'src/product/infrastructure/entity/product.entity';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';

export class Product {
  private _id: number;
  private _name: string;
  private _price: number;
  private _stock: number;

  constructor(id: number, name: string, price: number, stock: number) {
    this._id = id;
    this._name = name;
    this._price = price;
    this._stock = stock;
  }

  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get price(): number {
    return this._price;
  }

  get stock(): number {
    return this._stock;
  }

  static fromEntity(entity: ProductEntity): Product {
    return new Product(entity.id, entity.name, entity.price, entity.stock);
  }

  toEntity(): ProductEntity {
    const entity = new ProductEntity();
    entity.id = this._id;
    entity.name = this._name;
    entity.price = this._price;
    entity.stock = this._stock;
    return entity;
  }

  toDto(): ProductDto {
    return new ProductDto(this._id, this._name, this._price, this._stock);
  }

  static fromDto(dto: ProductDto): Product {
    return new Product(dto.id, dto.name, dto.price, dto.stock);
  }
}
