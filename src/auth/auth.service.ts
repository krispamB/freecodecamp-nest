import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuthDto } from './dto'
import * as argon from 'argon2'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  async signup(dto: AuthDto) {
    /*Generate Password */
    const hash = await argon.hash(dto.password)

    /*Save the token to db*/
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      })
      return this.signToken(user.id, user.email)
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException(
          'Cridentials taken',
        )
      }
      throw error
    }
  }

  async signin(dto: AuthDto) {
    /*find user by email
    if no user exists throw exception*/
    const user =
      await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      })
    /*Guard condition */
    if (!user)
      throw new ForbiddenException(
        'Cridentials incorrect',
      )
    /*compare passwords 
    if password incorrect throw exception*/
    const pwMatch = await argon.verify(
      user.hash,
      dto.password,
    )

    if (!pwMatch)
      throw new ForbiddenException(
        'Cridentials incorrect',
      )
    return this.signToken(user.id, user.email)
  }

  async signToken(
    userId: string,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    }

    const token = await this.jwt.signAsync(
      payload,
      {
        expiresIn: '15m',
        secret: this.config.get('JWT_SECRET'),
      },
    )

    return {
      access_token: token,
    }
  }
}
