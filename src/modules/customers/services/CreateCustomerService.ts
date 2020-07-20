import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    const emailInUse = await this.customersRepository.findByEmail(email);

    if (emailInUse) {
      throw new AppError('This email is already in use.');
    }

    const user = await this.customersRepository.create({
      email,
      name,
    });

    return user;
  }
}

export default CreateCustomerService;
