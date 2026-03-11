import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedApiConfigModule } from '@realworld/shared/api/config';
import { SharedApiErrorHandlerModule } from '@realworld/shared/api/error-handler';
import { SharedApiValidationsModule } from '@realworld/shared/api/validations';
import { IApiConfig } from '@realworld/shared/api/config';


@Module({})
export class SharedApiCoreModule {
  static forRoot(environment: IApiConfig): DynamicModule {
    return {
      module: SharedApiCoreModule,
      imports: [
        SharedApiConfigModule.forRoot(environment),
        TypeOrmModule.forRoot(),
        SharedApiErrorHandlerModule,
        SharedApiValidationsModule,
      ],
      controllers: [],
      providers: [],
      exports: [],
    };
  }
}
