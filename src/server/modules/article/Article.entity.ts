import * as R from 'ramda';
import {Expose, Transform} from 'class-transformer';
import {
  Entity, Column, PrimaryGeneratedColumn,
  ManyToMany, JoinTable, RelationId, ManyToOne,
  JoinColumn,
} from 'typeorm';

import {htmlToMarkdown} from '@server/shared/helpers';

import {TagEntity} from '@server/modules/tag/Tag.entity';
import {DatedRecordEntity} from '../database/DatedRecord.entity';
import {ArticleCategoryEntity} from '../article-category/ArticleCategory.entity';
import {UserEntity} from '../user/User.entity';
import {AttachmentEntity} from '../attachment/Attachment.entity';

@Entity('articles')
export class ArticleEntity extends DatedRecordEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column(
    {
      type: 'varchar',
      length: 140,
      unique: true,
    },
  )
  title: string;

  @Column('text')
  lead: string;

  @Column('text')
  content: string;

  @Column({nullable: true})
  visible: boolean;

  @Transform(R.map(R.prop('name')))
  @JoinTable()
  @ManyToMany('TagEntity')
  tags: TagEntity[];

  @ManyToOne('ArticleCategoryEntity')
  @JoinColumn({name: 'categoryId'})
  category: ArticleCategoryEntity;

  @ManyToOne('AttachmentEntity', {nullable: true, onDelete: 'SET NULL'})
  @JoinColumn({name: 'coverAttachmentId'})
  cover: AttachmentEntity;

  @ManyToOne('UserEntity', {onDelete: 'SET NULL'})
  @JoinColumn({name: 'userId'})
  user: UserEntity;

  @Column({select: false, nullable: true})
  @RelationId((article: ArticleEntity) => article.user)
  userId: number;

  @Column({select: false})
  @RelationId((article: ArticleEntity) => article.category)
  categoryId: number;

  @Column({select: false, nullable: true})
  @RelationId((article: ArticleEntity) => article.user)
  coverAttachmentId: number;

  @Expose()
  get html(): string {
    if (!this.content)
      return '';

    return htmlToMarkdown(this.content);
  }

  constructor(partial: Partial<ArticleEntity>) {
    super();
    Object.assign(this, partial);
  }
}
