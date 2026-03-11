# Critical Security Fixes

- **상태**: completed
- **관련 이슈**: #2, #3
- **우선순위**: CRITICAL
- **생성일**: 2026-03-11

## 개요

프로젝트의 CRITICAL/HIGH 보안 취약점을 수정합니다.

## 변경 사항

### Task 1: 환경변수 기반 설정 전환 (이슈 #2)

**문제**: JWT 시크릿(`'jwtSecret'`)과 DB 비밀번호(`'qwerty1'`)가 소스코드에 하드코딩됨.

**수정 파일:**
| 파일 | 변경 내용 |
|------|----------|
| `.env.example` | 환경변수 템플릿 생성 |
| `.gitignore` | `.env` 추가 |
| `ormconfig.js` | `process.env` 사용으로 전환 |
| `environment.ts` | `process.env` 사용으로 전환 |
| `environment.prod.ts` | `process.env` 사용으로 전환 |
| `main.ts` | CORS 오리진 제한 |

**환경변수 목록:**

- `JWT_SECRET` — JWT 서명 시크릿 (기본값: 개발용 랜덤 문자열)
- `JWT_EXPIRES_IN` — JWT 만료 시간 (기본값: `1d`)
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `CORS_ORIGIN` — 허용 오리진 (기본값: `http://localhost:4200`)

### Task 2: 인가(Authorization) 취약점 수정 (이슈 #3)

**문제 A**: `article-api-handlers.controller.ts` update 메서드에 작성자 검증 없음.
**문제 B**: `roles.guard.ts`에서 `!request.user` → `return true`로 인증 우회 가능.

**수정 파일:**
| 파일 | 변경 내용 |
|------|----------|
| `article-api-handlers.controller.ts:43-57` | update에 작성자 검증 추가 (delete와 동일 패턴) |
| `roles.guard.ts:18-20` | `return true` → `return false` |

### Task 3: SQL 와일드카드 인젝션 방지

**문제**: `Like(\`%${tag}%\`)` — 사용자 입력이 직접 LIKE 패턴에 삽입됨.

**수정 파일:**
| 파일 | 변경 내용 |
|------|----------|
| `article-api-handlers.controller.ts:125` | tag 입력에서 `%`, `_` 이스케이프 처리 |

## 검증 계획

- [x] 환경변수 없이 기본값으로 정상 동작 확인 (fallback 값 적용)
- [x] article update 작성자 검증 코드 적용 (delete와 동일 패턴)
- [x] RolesGuard `return false` 변경 완료
- [x] tag 검색 시 `%`, `_` 이스케이프 처리 완료
- [x] tsc --noEmit 타입 체크 통과 (api + conduit)
