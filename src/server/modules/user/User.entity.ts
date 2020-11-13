import * as bcrypt from 'bcrypt';
import * as R from 'ramda';
import {Exclude, classToPlain, Expose} from 'class-transformer';
import {
  Entity, Column, PrimaryGeneratedColumn,
  BeforeUpdate, BeforeInsert, OneToMany,
} from 'typeorm';

import {UserScope} from '@server/constants/shared';
import {DatedRecordEntity} from '../database/DatedRecord.entity';
import {UserScopeEntity} from './Scope.entity';

export type SafeUserJSON = Pick<UserEntity, 'id'|'name'|'scopes'>;
@Entity('users')
export class UserEntity extends DatedRecordEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column(
    {
      type: 'varchar',
      length: 100,
      unique: true,
      nullable: false,
    },
  )
  name: string;

  @Exclude()
  @Column(
    {
      type: 'text',
      nullable: false,
    },
  )
  salt: string;

  @Exclude()
  @Column(
    {
      type: 'text',
      nullable: false,
    },
  )
  password: string;

  @Exclude()
  @Column(
    {
      type: 'text',
      nullable: true,
    },
  )
  refreshToken: string;

  @OneToMany(() => UserScopeEntity, (scope) => scope.user)
  @Exclude()
  scopesRecords: UserScopeEntity[];

  @Expose()
  get scopes(): UserScope[] {
    return this.scopesRecords?.map((scope) => scope.value);
  }

  constructor(partial: Partial<UserEntity>) {
    super();
    Object.assign(this, partial);
  }

  @BeforeInsert()
  @BeforeUpdate()
  hashPassword() {
    if (!R.isNil(this.password)) {
      this.salt = this.salt || bcrypt.genSaltSync();
      this.password = this.encryptSaltedPassword(this.password);
    }
  }

  /**
   * Creates password hash with salt
   *
   * @param {string} password
   * @returns {string}
   * @memberof UserEntity
   */
  encryptSaltedPassword(password: string): string {
    return bcrypt.hashSync(password, this.salt);
  }

  /**
   * Picks only safe fields from users and serializes it
   *
   * @returns {SafeUserJSON}
   * @memberof UserEntity
   */
  toJSON(): SafeUserJSON {
    return <SafeUserJSON> classToPlain(this);
  }
}
