import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const admin = this.supabase.getAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      user_metadata: { full_name: dto.fullName },
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes('already')) throw new ConflictException('Email déjà utilisé');
      throw new UnauthorizedException(error.message);
    }

    const payload: JwtPayload = { sub: data.user.id, email: data.user.email! };
    return { accessToken: this.jwtService.sign(payload), user: this.formatUser(data.user) };
  }

  async login(dto: LoginDto) {
    const client = this.supabase.getClient();

    const { data, error } = await client.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.user) throw new UnauthorizedException('Identifiants invalides');

    const payload: JwtPayload = { sub: data.user.id, email: data.user.email! };
    return { accessToken: this.jwtService.sign(payload), user: this.formatUser(data.user) };
  }

  async getProfile(userId: string) {
    const admin = this.supabase.getAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user) throw new UnauthorizedException();
    return this.formatUser(data.user);
  }

  private formatUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name ?? '',
      createdAt: user.created_at,
    };
  }
}
