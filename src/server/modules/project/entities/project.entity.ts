import * as R from 'ramda';
import {Transform} from 'class-transformer';
import {
  Entity, Column, PrimaryGeneratedColumn,
  OneToOne, ManyToMany, JoinTable, JoinColumn,
  RelationId,
} from 'typeorm';

import {Tag} from '@server/modules/tag/tag.entity';
import {CompilerInput} from './compilerInput.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column(
    {
      type: 'varchar',
      length: 200,
      unique: true,
    },
  )
  title: string;

  @OneToOne('CompilerInput', 'project', {onDelete: 'CASCADE'})
  @JoinColumn({name: 'inputId'})
  input: CompilerInput;

  @RelationId((project: Project) => project.input)
  inputId: number;

  @Transform(R.map(R.prop('name')))
  @JoinTable()
  @ManyToMany('Tag')
  tags: Tag[];

  constructor(partial: Partial<Project>) {
    Object.assign(this, partial);
  }
}
