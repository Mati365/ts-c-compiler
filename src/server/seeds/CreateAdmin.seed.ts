/* eslint-disable import/no-default-export */
import {Factory, Seeder} from 'typeorm-seeding';
import {Connection} from 'typeorm';
import {$enum} from 'ts-enum-util';

import {UserEntity} from '@server/modules/user/User.entity';
import {UserScope} from '@server/constants/shared';
import {UserScopeEntity} from '@server/modules/user/Scope.entity';

export default class CreateAdmin implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    const {
      ADMIN_NAME = 'admin',
      ADMIN_PASS = '123456',
    } = process.env;

    const user = await (connection.getRepository('UserEntity').save(
      new UserEntity(
        {
          name: ADMIN_NAME,
          password: ADMIN_PASS,
        },
      ),
    ));

    await connection
      .createQueryBuilder()
      .insert()
      .into(UserScopeEntity)
      .values(
        $enum(UserScope).map(
          (scopeValue) => new UserScopeEntity(
            {
              value: scopeValue,
              user,
            },
          ),
        ),
      )
      .execute();
  }
}
