import { IApiConfig } from '@realworld/shared/api/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../../../package.json');

export const environment: IApiConfig = {
  production: false,
  applicationName: 'Sen Viet API',
  host: 'http://localhost',
  port: 3333,
  version: packageJson.version,
  debug: true,
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};
