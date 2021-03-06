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
    const product = this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const ids = products.map(product => product.id);

    const listOfProducts = await this.ormRepository.find({
      where: { id: In(ids) },
    });

    return listOfProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const idsToFind = products.map(product => ({ id: product.id }));

    const quantitiesToUpdate: Record<string, any> = {};

    products.forEach(product => {
      quantitiesToUpdate[product.id] = product.quantity;
    });

    const locatedProducts = await this.findAllById(idsToFind);

    const productsToUpdate = locatedProducts.map(product => {
      const updatedProduct = product;

      updatedProduct.quantity = quantitiesToUpdate[product.id];

      return updatedProduct;
    });

    await this.ormRepository.save(productsToUpdate);

    return productsToUpdate;
  }
}

export default ProductsRepository;
