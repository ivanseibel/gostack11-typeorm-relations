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
    const customerExists = await this.customersRepository.findById(customer_id);

    if (!customerExists) {
      throw new AppError('Customer does not exist.');
    }

    const productsIds = products.map(product => ({ id: product.id }));
    const productsMatch = await this.productsRepository.findAllById(
      productsIds,
    );

    if (productsMatch.length !== products.length) {
      throw new AppError('Some of requested products  does not exist.');
    }

    const productsToUpdateQuantity: IProduct[] = [];

    const orderProducts = productsMatch.map(productMatch => {
      const requestedProduct = products.find(product => {
        return product.id === productMatch.id && product.quantity;
      });

      if (productMatch.quantity < (requestedProduct?.quantity || 0)) {
        throw new AppError(`Product is out of stock: ${productMatch.name}.`);
      }

      productsToUpdateQuantity.push({
        id: productMatch.id,
        quantity: productMatch.quantity - (requestedProduct?.quantity || 0),
      });

      return {
        product_id: productMatch.id,
        price: productMatch.price,
        quantity: requestedProduct?.quantity || 0,
      };
    });

    const order = await this.ordersRepository.create({
      customer: customerExists,
      products: orderProducts,
    });

    await this.productsRepository.updateQuantity(productsToUpdateQuantity);

    return order;
  }
}

export default CreateOrderService;
