import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {UserScopeEntity} from './Scope.entity';
import {UserController} from './User.controller';
import {UserEntity} from './User.entity';
import {UserService} from './User.service';

@Module(
  {
    imports: [
      TypeOrmModule.forFeature(
        [
          UserEntity,
          UserScopeEntity,
        ],
      ),
    ],
    providers: [
      UserService,
    ],
    exports: [
      UserService,
    ],
    controllers: [
      UserController,
    ],
  },
)
export class UserModule {}
