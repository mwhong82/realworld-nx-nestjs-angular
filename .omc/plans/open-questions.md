# Open Questions

## vibe-coding-transformation - 2026-03-11
- [ ] Cypress E2E 테스트 실행 시 MySQL DB가 필요한데, Docker Compose로 테스트 DB를 제공할 것인지 아니면 로컬 MySQL 사전 설정을 가정할 것인지 -- E2E 테스트의 CI/CD 이식성에 영향
- [ ] `app.controller.spec.ts`가 존재하지 않는 `AppService`를 참조하고 있어 현재 깨진 상태. 이 파일을 수정할 것인지 삭제할 것인지 -- Task 2.1에서 결정 필요
- [ ] 80% coverage 목표에서 shared 라이브러리 17개를 모두 포함할 것인지, 핵심 도메인(article, user)만 대상으로 할 것인지 -- 테스트 작업량에 큰 영향
- [ ] Husky/lint-staged 추가 시 `npm install` 후 `husky install`이 자동 실행되도록 `prepare` script를 추가하는데, 기존 `postinstall` script와의 순서/호환성 확인 필요 -- Phase 3 설정 안정성
- [ ] OpenSpec 스펙을 Markdown으로 작성할 것인지 YAML/JSON 형식으로 작성할 것인지 -- spec-driven workflow의 도구 호환성에 영향
- [ ] `ormconfig.js`에 하드코딩된 DB credentials (root/qwerty1)을 dotenv로 전환할 것인지 -- 보안 개선이지만 scope 밖일 수 있음
