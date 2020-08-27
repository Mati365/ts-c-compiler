import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column(
    {
      type: 'varchar',
      length: 60,
      unique: true,
    },
  )
  name: string;
}
