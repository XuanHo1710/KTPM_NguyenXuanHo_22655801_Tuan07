import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const appServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    getUsers: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should register user and return user list', async () => {
      appServiceMock.register.mockResolvedValue({
        message: 'Đăng ký thành công',
        user: {
          id: '1',
          username: 'alice',
          email: 'alice@mail.com',
          createdAt: new Date().toISOString(),
        },
      });
      appServiceMock.getUsers.mockResolvedValue({
        users: [
          {
            id: '1',
            username: 'alice',
            email: 'alice@mail.com',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const registerResult = await appController.register({
        username: 'alice',
        email: 'alice@mail.com',
        password: 'secret123',
      });

      expect(registerResult.user.username).toBe('alice');

      const usersResult = await appController.getUsers();
      expect(usersResult.users).toHaveLength(1);
      expect(usersResult.users[0]?.email).toBe('alice@mail.com');
    });
  });
});
