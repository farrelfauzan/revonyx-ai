import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  HttpCode,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto/create-auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async register(@Body() body: unknown) {
    const parsed = RegisterDto.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }
    return this.authService.register(parsed.data);
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() body: unknown) {
    const parsed = LoginDto.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }
    return this.authService.login(parsed.data);
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  @Post("keys/regenerate")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(200)
  async regenerateApiKey(@Req() req: any) {
    return this.authService.regenerateApiKey(req.user.userId);
  }
}
