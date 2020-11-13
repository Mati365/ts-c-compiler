import {BeforeInsert, BeforeUpdate, CreateDateColumn} from 'typeorm';

export class DatedRecordEntity {
  @CreateDateColumn({type: 'timestamp'})
  createdAt: Date;

  @CreateDateColumn({type: 'timestamp'})
  updatedAt?: Date;

  @BeforeInsert()
  updateDateCreation() {
    this.createdAt = new Date;
  }

  @BeforeUpdate()
  updateDateUpdate() {
    this.updatedAt = new Date;
  }
}
