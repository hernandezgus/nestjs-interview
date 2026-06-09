import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type JwtPayload = {
  sub: number;
  username: string;
};

@Injectable()
export class AuthService {
  private readonly validUsername = 'admin';
  private readonly validPassword = 'password';

  constructor(private readonly jwtService: JwtService) {}

  async login(username: string, password: string) {
    if (
      username !== this.validUsername ||
      password !== this.validPassword
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: 1,
      username,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
