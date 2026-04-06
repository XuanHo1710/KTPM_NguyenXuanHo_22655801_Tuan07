import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

type RegisterPayload = {
  username?: string;
  email?: string;
  password?: string;
};

type LoginPayload = {
  identifier?: string;
  password?: string;
};

type JwtClaims = {
  sub: string;
  username: string;
  iat: number;
  exp: number;
};

type PublicUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

@Injectable()
export class AppService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private readonly jwtSecret = process.env.JWT_SECRET ?? 'simple-jwt-secret';

  async register(
    payload: RegisterPayload = {},
  ): Promise<{ message: string; user: PublicUser }> {
    const username = payload.username?.trim().toLowerCase();
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password;

    if (!username || !email || !password) {
      throw new BadRequestException('username, email, password là bắt buộc');
    }

    if (password.length < 6) {
      throw new BadRequestException('password phải có ít nhất 6 ký tự');
    }

    const exists = await this.userModel.exists({
      $or: [{ username }, { email }],
    });

    if (exists) {
      throw new BadRequestException('username hoặc email đã tồn tại');
    }

    const user = await this.userModel.create({
      username,
      email,
      passwordHash: this.hashPassword(password),
    });

    return {
      message: 'Đăng ký thành công',
      user: this.toPublicUser(user),
    };
  }

  async login(payload: LoginPayload = {}): Promise<{
    message: string;
    accessToken: string;
    user: PublicUser;
  }> {
    const identifier = payload.identifier?.trim().toLowerCase();
    const password = payload.password;

    if (!identifier || !password) {
      throw new BadRequestException('identifier và password là bắt buộc');
    }

    const user = await this.userModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user || !this.comparePassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const accessToken = this.createJwt({
      sub: user.id,
      username: user.username,
    });

    return {
      message: 'Đăng nhập thành công',
      accessToken,
      user: this.toPublicUser(user),
    };
  }

  async getUsers(authorization?: string): Promise<{ users: PublicUser[] }> {
    // Nếu client gửi Authorization thì xác thực token, không gửi thì vẫn cho phép.
    if (authorization) {
      this.verifyAuthorizationHeader(authorization);
    }

    const users = await this.userModel.find().sort({ createdAt: -1 }).exec();

    return {
      users: users.map((user) => this.toPublicUser(user)),
    };
  }

  async findOne(id: string): Promise<PublicUser | null> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      return null;
    }
    return this.toPublicUser(user);
  }

  private toPublicUser(user: UserDocument): PublicUser {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  private comparePassword(password: string, hash: string): boolean {
    const incoming = Buffer.from(this.hashPassword(password));
    const existing = Buffer.from(hash);

    if (incoming.length !== existing.length) {
      return false;
    }

    return timingSafeEqual(incoming, existing);
  }

  private createJwt(payload: Pick<JwtClaims, 'sub' | 'username'>): string {
    const now = Math.floor(Date.now() / 1000);
    const claims: JwtClaims = {
      ...payload,
      iat: now,
      exp: now + 60 * 60,
    };

    const header = this.base64UrlEncode(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    );
    const body = this.base64UrlEncode(JSON.stringify(claims));
    const signature = this.sign(`${header}.${body}`);

    return `${header}.${body}.${signature}`;
  }

  private verifyAuthorizationHeader(authorization: string): JwtClaims {
    const [type, token] = authorization.split(' ');

    if (type?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Authorization header không hợp lệ');
    }

    return this.verifyJwt(token);
  }

  private verifyJwt(token: string): JwtClaims {
    const [header, payload, signature] = token.split('.');

    if (!header || !payload || !signature) {
      throw new UnauthorizedException('JWT không hợp lệ');
    }

    const expectedSignature = this.sign(`${header}.${payload}`);
    if (signature !== expectedSignature) {
      throw new UnauthorizedException('JWT signature không hợp lệ');
    }

    const decodedPayload = this.base64UrlDecode(payload);
    const claims = JSON.parse(decodedPayload) as Partial<JwtClaims>;

    if (!claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('JWT đã hết hạn');
    }

    if (
      !claims.sub ||
      typeof claims.sub !== 'string' ||
      !claims.username ||
      typeof claims.username !== 'string'
    ) {
      throw new UnauthorizedException('JWT payload không hợp lệ');
    }

    return claims as JwtClaims;
  }

  private sign(content: string): string {
    return createHmac('sha256', this.jwtSecret)
      .update(content)
      .digest('base64url');
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value).toString('base64url');
  }

  private base64UrlDecode(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8');
  }
}
