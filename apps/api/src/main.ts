import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiConfigService } from '@realworld/shared/api/config';

import { AppModule } from './app/app.module';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const morgan = require('morgan');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rfs = require('rotating-file-stream');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  });
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.use(morgan('dev'));

  const accessLogStream = rfs.createStream('access.log', {
    interval: '1d', // rotate daily
    path: './log',
  });
  app.use(morgan('combined', { stream: accessLogStream }));

  const configs = app.get<ApiConfigService>('ApiConfigService').configs;
  const port = configs.port || 3333;
  await app.listen(port, () => {
    Logger.log(
      `Listening at ${configs.host || 'http://localhost'}:${
        configs.port
      }/${globalPrefix}`
    );
  });
}

bootstrap();
