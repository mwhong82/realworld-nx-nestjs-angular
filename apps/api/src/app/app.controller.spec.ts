import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();
  });

  it('AppController 인스턴스가 생성되어야 한다', () => {
    const appController = app.get<AppController>(AppController);
    expect(appController).toBeDefined();
  });
});
