import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { SharedApiCoreModule } from '@realworld/shared/api/core';
import { UserApiHandlersModule } from '@realworld/user/api/handlers';
import { ArticleApiHandlersModule } from '@realworld/article/api/handlers';
import { environment } from '../environments/environment';

@Module({
  imports: [
    SharedApiCoreModule.forRoot(environment),
    UserApiHandlersModule,
    ArticleApiHandlersModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
