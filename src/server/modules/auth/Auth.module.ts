import {Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {PassportModule} from '@nestjs/passport';

import {ENV} from '@server/constants/env';

import {UserModule} from '../user/User.module';
import {AuthService} from './Auth.service';
import {AuthController} from './Auth.controller';
import {
  JwtStrategy,
  LocalStrategy,
} from './strategy';

@Module(
  {
    imports: [
      PassportModule.register(
        {
          defaultStrategy: 'jwt',
        },
      ),
      JwtModule.register(
        {
          secret: ENV.token.secret,
          signOptions: {
            expiresIn: `${ENV.token.expire}s`,
          },
        },
      ),
      UserModule,
    ],
    controllers: [
      AuthController,
    ],
    providers: [
      AuthService,
      LocalStrategy,
      JwtStrategy,
    ],
  },
)
export class AuthModule {}
