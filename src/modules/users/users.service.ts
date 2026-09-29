import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { getGMT7Date } from '../../utils/date-utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findOneByPhone(phoneZalo: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phoneZalo } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: UserStatus): Promise<void> {
    await this.usersRepository.update(id, { status });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: getGMT7Date() });
  }

  async update(id: string, updates: Partial<User>): Promise<void> {
    await this.usersRepository.update(id, updates);
  }
}
