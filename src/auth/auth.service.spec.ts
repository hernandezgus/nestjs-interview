import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtServiceMock: { signAsync: jest.Mock };

  beforeEach(async () => {
    jwtServiceMock = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should return an access token for valid credentials', async () => {
    await expect(authService.login('admin', 'password')).resolves.toEqual({
      access_token: 'signed-jwt-token',
    });
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      sub: 1,
      username: 'admin',
    });
  });

  it('should throw for invalid credentials', async () => {
    await expect(authService.login('admin', 'wrong-password')).rejects.toThrow(
      new UnauthorizedException('Invalid credentials'),
    );
  });
});
