import {
  Column, Entity,
  JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
  RelationId, Unique,
} from 'typeorm';

import {UserScope} from '@server/constants/shared';
import {UserEntity} from './User.entity';

@Entity('users_scopes')
@Unique('uq_user_assign', ['userId', 'value'])
export class UserScopeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column(
    {
      type: 'tinyint',
      nullable: false,
    },
  )
  value: UserScope;

  @ManyToOne(() => UserEntity, (user) => user.scopesRecords, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'userId'})
  user: UserEntity;

  @Column({select: false})
  @RelationId((scope: UserScopeEntity) => scope.user)
  userId: number;

  constructor(partial: Partial<UserScopeEntity>) {
    Object.assign(this, partial);
  }
}
