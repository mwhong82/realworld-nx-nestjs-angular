import { IApiConfig } from '@realworld/shared/api/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../../../package.json')

export const environment: IApiConfig = {
  production: true,
  applicationName: 'Sen Viet API',
  host: 'http://localhost',
  port: 3333,
  version: packageJson.version,
  debug: true,
  jwtSecret: 'jwtSecret',
  jwtExpiresIn: '1y'
};
