import { Repository } from 'typeorm';
import { AppDataSource } from '../../../db/data-source';
import { User, UserRole } from '../../../db/entities/user.entity';

const repo: Repository<User> = AppDataSource.getRepository(User);

export async function findById(id: string): Promise<User | null> {
  return repo.findOneBy({ id });
}

export async function findByEmail(email: string): Promise<User | null> {
  return repo.findOneBy({ email });
}

export async function findByPhone(phone: string): Promise<User | null> {
  return repo.findOneBy({ phone });
}

export async function findByRole(role: UserRole): Promise<User[]> {
  return repo.findBy({ role });
}

export async function findAll(): Promise<User[]> {
  return repo.find();
}
