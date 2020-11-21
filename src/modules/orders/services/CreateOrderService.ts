import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('Not exist customer');
    }
    if (!products) {
      throw new AppError('Not exist product');
    }
    const listProduct = products.map(product => {
      return { id: product.id };
    });
    const findListProduct = await this.productsRepository.findAllById(
      listProduct,
    );
    if (findListProduct.length < 1) {
      throw new AppError('Quantity insuficient');
    }

    const productOrder = products.map(itemProduct => {
      const index = findListProduct.findIndex(
        product => product.id === itemProduct.id,
      );
      if (itemProduct.quantity > findListProduct[index].quantity)
        throw new AppError('There are not quantity enougt in stck');
      return {
        product_id: itemProduct.id,
        price: findListProduct[index].price,
        quantity: itemProduct.quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productOrder,
    });

    const updateProduct = products.map(itemUpdate => {
      const updateListIndex = findListProduct.findIndex(
        product => product.id === itemUpdate.id,
      );
      return {
        id: itemUpdate.id,
        quantity:
          findListProduct[updateListIndex].quantity - itemUpdate.quantity,
      };
    });
    await this.productsRepository.updateQuantity(updateProduct);
    return order;
  }
}
export default CreateOrderService;
