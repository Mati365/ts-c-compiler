require('dotenv').config();

const {
  DB_NAME,
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_PORT,
} = process.env;

module.exports = {
  type: 'mysql',
  database: DB_NAME,
  host: DB_HOST,
  username: DB_USER,
  password: DB_PASS,
  port: +DB_PORT,
  seeds: ['src/seeds/**/*.seed.ts'],
  factories: ['src/seeds/factories/**/*.factory.ts'],
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
  cli: {
    migrationsDir: 'src/migrations',
  },
};
