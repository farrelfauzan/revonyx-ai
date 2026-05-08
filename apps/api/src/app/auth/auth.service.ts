import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto, LoginDto } from "./dto/create-auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private generateApiKey(): string {
    return `sk_live_${crypto.randomBytes(24).toString("hex")}`;
  }

  private maskApiKey(key: string): string {
    return key.slice(0, 8) + "..." + key.slice(-4);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const apiKey = this.generateApiKey();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        apiKey,
      },
      select: {
        id: true,
        email: true,
        apiKey: true,
        balance: true,
        createdAt: true,
      },
    });

    const token = this.signToken(user.id, user.email);

    return {
      user,
      token,
      apiKeyWarning:
        "Store this key securely. It will not be shown again in full.",
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const token = this.signToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        balance: true,
        apiKey: true,
        createdAt: true,
      },
    });
    return {
      ...user,
      apiKey: this.maskApiKey(user.apiKey),
    };
  }

  async regenerateApiKey(userId: string) {
    const apiKey = this.generateApiKey();
    await this.prisma.user.update({
      where: { id: userId },
      data: { apiKey },
    });
    return {
      apiKey,
      apiKeyWarning:
        "Store this key securely. It will not be shown again in full.",
    };
  }

  private signToken(userId: string, email: string): string {
    return this.jwtService.sign({ userId, email });
  }
}
