import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';
import {DatedRecordEntity} from '../database/DatedRecord.entity';

@Entity('article_categories')
export class ArticleCategoryEntity extends DatedRecordEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column(
    {
      type: 'varchar',
      length: 100,
      unique: true,
    },
  )
  name: string;

  constructor(partial: Partial<ArticleCategoryEntity>) {
    super();
    Object.assign(this, partial);
  }
}
