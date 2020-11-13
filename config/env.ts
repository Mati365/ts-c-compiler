/* eslint-disable import/no-default-export */
const path = require('path');

require('dotenv').config();

type AppEnv = {
  uploader: {
    cdnUrl: string,
    destination: string,
    limitSize: number,
  },
  token: {
    rootUser: string,
    secret: string,
    expire: number, // seconds
  },
  listen: {
    port: number,
    address: string,
  },
  dbConfig: {
    database: string,
    host: string,
    username: string,
    password: string,
    port: number,
  },
};

const {
  APP_PORT,
  APP_LISTEN_ADDRESS,
  DB_NAME,
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_PORT,
  JWT_SECRET,
  JWT_EXPIRE_IN_SECONDS,
  JWT_ROOT_USER_KEY,
  PUBLIC_CDN_URL,
  FILE_UPLOAD_PATH,
  MAX_FILE_UPLOAD_SIZE,
} = process.env;

export const GLOBAL_CONFIG: Record<string, AppEnv> = {
  shared: {
    uploader: {
      cdnUrl: PUBLIC_CDN_URL,
      destination: path.resolve(__dirname, FILE_UPLOAD_PATH),
      limitSize: +MAX_FILE_UPLOAD_SIZE,
    },
    token: {
      rootUser: JWT_ROOT_USER_KEY,
      secret: JWT_SECRET,
      expire: +JWT_EXPIRE_IN_SECONDS,
    },
    listen: {
      port: +APP_PORT,
      address: APP_LISTEN_ADDRESS,
    },
    dbConfig: {
      database: DB_NAME,
      host: DB_HOST,
      username: DB_USER,
      password: DB_PASS,
      port: +DB_PORT,
    },
  },
};
