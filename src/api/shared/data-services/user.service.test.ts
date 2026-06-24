/// <reference types="jest" />

jest.mock('../../../db/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn().mockReturnValue({
      findOneBy: jest.fn(),
      findBy: jest.fn(),
      find: jest.fn(),
    }),
  },
}));

import { User, UserRole } from '../../../db/entities/user.entity';
import * as userService from './user.service';

describe('UserService (functional)', () => {
  let mockRepo: {
    findOneBy: jest.Mock;
    findBy: jest.Mock;
    find: jest.Mock;
  };

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    phone: '09171234567',
    role: UserRole.WORKER,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deactivated: false,
  } as User;

  const mockUsers: User[] = [
    mockUser,
    { ...mockUser, id: '660e8400-e29b-41d4-a716-446655440001', email: 'worker2@example.com', role: UserRole.WORKER } as User,
    { ...mockUser, id: '770e8400-e29b-41d4-a716-446655440002', email: 'client@example.com', role: UserRole.CLIENT } as User,
  ];

  beforeAll(() => {
    const { AppDataSource } = require('../../../db/data-source');
    mockRepo = AppDataSource.getRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser);

      const result = await userService.findById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: mockUser.id });
    });

    it('should return null when user is not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      const result = await userService.findById('nonexistent-id');

      expect(result).toBeNull();
      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: 'nonexistent-id' });
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser);

      const result = await userService.findByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ email: mockUser.email });
    });

    it('should return null when email does not exist', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      const result = await userService.findByEmail('unknown@example.com');

      expect(result).toBeNull();
      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ email: 'unknown@example.com' });
    });
  });

  describe('findByRole', () => {
    it('should return users matching the given role', async () => {
      const workers = mockUsers.filter((u) => u.role === UserRole.WORKER);
      mockRepo.findBy.mockResolvedValue(workers);

      const result = await userService.findByRole(UserRole.WORKER);

      expect(result).toHaveLength(2);
      expect(result.every((u) => u.role === UserRole.WORKER)).toBe(true);
      expect(mockRepo.findBy).toHaveBeenCalledWith({ role: UserRole.WORKER });
    });

    it('should return an empty array when no users have that role', async () => {
      mockRepo.findBy.mockResolvedValue([]);

      const result = await userService.findByRole(UserRole.ADMIN);

      expect(result).toEqual([]);
      expect(mockRepo.findBy).toHaveBeenCalledWith({ role: UserRole.ADMIN });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      mockRepo.find.mockResolvedValue(mockUsers);

      const result = await userService.findAll();

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockUsers);
      expect(mockRepo.find).toHaveBeenCalledWith();
    });

    it('should return an empty array when no users exist', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await userService.findAll();

      expect(result).toEqual([]);
      expect(mockRepo.find).toHaveBeenCalledWith();
    });
  });
});
