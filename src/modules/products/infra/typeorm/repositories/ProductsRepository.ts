import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const products = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(products);

    return products;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProducts = await this.ormRepository.findOne({
      where: {
        name,
      },
    });
    return findProducts;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const idProducts = products.map(product => product.id);
    const loadProducts = await this.ormRepository.find({
      id: In(idProducts),
    });
    return loadProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const listProduct = products.map(product => {
      return { id: product.id };
    });

    const findListProduct = await this.ormRepository.findByIds(listProduct);

    const productOrder = products.map(product => {
      const index = findListProduct.findIndex(value => value.id === product.id);
      findListProduct[index].quantity = product.quantity;
      return findListProduct[index];
    });
    await this.ormRepository.save(productOrder);
    return productOrder;
  }
}

export default ProductsRepository;
