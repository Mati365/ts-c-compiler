require('dotenv').config();

type AppEnv = Partial<{
  listen: {
    port: number,
    address: string,
  },
}>;

const {
  APP_PORT = process.env.PORT || process.env.APP_PORT || 3000,
  APP_LISTEN_ADDRESS = 'localhost',
} = process.env;

export const GLOBAL_CONFIG: Record<string, AppEnv> = {
  shared: {
    listen: {
      port: +APP_PORT,
      address: APP_LISTEN_ADDRESS,
    },
  },
};
