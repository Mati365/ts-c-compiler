import {Entity, Column, PrimaryGeneratedColumn, OneToOne} from 'typeorm';
import {EmulatorLanguage} from '@client/context/emulator-state/state';
import {Project} from './project.entity';

@Entity()
export class CompilerInput {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  code: string;

  @Column(
    {
      type: 'enum',
      enum: EmulatorLanguage,
      default: EmulatorLanguage.ASM,
    },
  )
  language: EmulatorLanguage;

  @OneToOne('Project', 'input')
  project: Project;

  constructor(partial: Partial<CompilerInput>) {
    Object.assign(this, partial);
  }
}
