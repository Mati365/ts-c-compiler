const DEV_BUILD = process.env.NODE_ENV !== 'production';

export const isDevBuild = () => DEV_BUILD;
