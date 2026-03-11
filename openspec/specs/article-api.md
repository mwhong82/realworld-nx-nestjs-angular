# 게시글 API 스펙

게시글, 댓글, 좋아요, 태그에 대한 API 경계(boundary) 스펙.

## 소스 파일

| 계층 | 경로 |
|------|------|
| 컨트롤러 | `libs/article/api/handlers/src/lib/article-api-handlers.controller.ts` |
| 모듈 | `libs/article/api/handlers/src/lib/article-api-handlers.module.ts` |
| 엔티티 | `libs/article/api/shared/src/lib/*.entity.ts` |
| 서비스 | `libs/article/api/shared/src/lib/*.service.ts` |
| DTO | `libs/article/api-interfaces/src/lib/article-api-interfaces.ts` |
| 프론트엔드 서비스 | `libs/article/shared/src/lib/*.service.ts` |
| 프론트엔드 컴포넌트 | `libs/article/feature/src/lib/` |

## 엔티티

### Article (게시글)
- **파일**: `article.entity.ts`
- **테이블**: articles
- **상속**: BaseEntity (UUID, createdAt, updatedAt, deletedDate)
- **필드**:
  - `slug` (문자열, 고유) — URL 친화적 식별자, 제목에서 생성
  - `title` (문자열) — 게시글 제목
  - `description` (문자열) — 짧은 요약
  - `body` (텍스트) — 전체 게시글 내용
  - `authorId` (문자열) — User 외래키
  - `tagList` (JSON) — 태그 이름 배열을 JSON으로 저장

### Comment (댓글)
- **파일**: `comment.entity.ts`
- **상속**: BaseEntity
- **필드**:
  - `body` (문자열) — 댓글 텍스트
  - `authorId` (문자열) — User 외래키
  - `articleSlug` (문자열) — Article의 slug를 통한 외래키

### Favorite (좋아요)
- **파일**: `favorite.entity.ts`
- **상속**: BaseEntity
- **필드**:
  - `userId` (문자열) — User 외래키
  - `articleSlug` (문자열) — Article의 slug를 통한 외래키

### Tag (태그)
- **파일**: `tag.entity.ts`
- **상속**: BaseEntity
- **필드**:
  - `name` (문자열) — 태그 라벨
  - `count` (숫자) — 사용 횟수

## API 엔드포인트

### 게시글

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| `POST` | `/articles` | 필수 | 게시글 생성. 제목에서 slug 생성. 새 태그가 있으면 자동 생성. |
| `PUT` | `/articles/:slug` | 필수 | slug로 게시글 수정. 작성자만 수정 가능. 제목 변경 시 slug 재생성. |
| `DELETE` | `/articles/:slug` | 필수 | 게시글 소프트 삭제. 작성자만 삭제 가능. |
| `GET` | `/articles/:slug` | 선택 | 단일 게시글 조회. 인증 시 작성자 프로필과 좋아요 상태 포함. |
| `GET` | `/articles` | 선택 | 게시글 목록. 쿼리 파라미터 지원: `author`, `tag`, `favorited`, `limit`, `offset`. 복잡한 필터링에 `createQueryBuilder` 사용. |
| `GET` | `/articles/feed` | 필수 | 팔로우한 작성자의 게시글. `limit`, `offset` 지원. |

### 댓글

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| `GET` | `/articles/:slug/comments` | 선택 | 게시글의 모든 댓글 조회. |
| `POST` | `/articles/:slug/comments` | 필수 | 게시글에 댓글 작성. |
| `DELETE` | `/articles/:slug/comments/:id` | 필수 | 댓글 소프트 삭제. 작성자만 삭제 가능. |

### 좋아요

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| `POST` | `/articles/:slug/favorite` | 필수 | 게시글 좋아요. 좋아요 수 증가. |
| `DELETE` | `/articles/:slug/favorite` | 필수 | 게시글 좋아요 취소. 좋아요 수 감소. |

### 태그

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| `GET` | `/tags` | @SkipAuth | 사용 횟수와 함께 전체 태그 목록 조회. |

## 응답 형식

모든 엔드포인트는 표준 타입으로 래핑된 응답을 반환:
- 단일 항목: `{ article: {...} }` 또는 `{ comment: {...} }`
- 목록: `{ articles: [...], articlesCount: N }` 또는 `{ comments: [...] }`
- 태그: `{ tags: [...] }`

게시글 응답에 포함되는 계산 필드:
- `author` — 전체 사용자 프로필 (username, bio, image, 팔로우 상태)
- `favorited` — 현재 사용자의 좋아요 여부
- `favoritesCount` — 총 좋아요 수

## 비즈니스 규칙

1. **Slug 생성**: 제목을 URL 친화적 slug로 변환. 고유해야 함.
2. **태그 관리**: 게시글 생성 시 존재하지 않는 태그는 자동 생성. 태그 `count`가 증감.
3. **권한**: 게시글/댓글의 작성자만 자신의 콘텐츠를 수정 또는 삭제 가능.
4. **소프트 삭제**: 게시글과 댓글은 소프트 삭제 사용 (deletedDate 컬럼). DB에 남아있지만 쿼리에서 제외.
5. **피드**: 인증된 사용자가 팔로우한 사용자의 게시글만 반환, 최신순 정렬.
6. **필터링**: `GET /articles`에서 `author`, `tag`, `favorited` 필터를 동시에 조합 가능.

## 에러 케이스

| 시나리오 | HTTP 상태 | 응답 |
|----------|----------|------|
| 게시글을 찾을 수 없음 | 404 | NotFoundException |
| 댓글을 찾을 수 없음 | 404 | NotFoundException |
| 수정 권한 없음 | 401 | UnauthorizedException |
| 필수 필드 누락 | 400 | ValidationError |
| 중복 slug | 409 | ConflictException |

## 컨트롤러 참고사항

`ArticleApiHandlersController`는 285줄의 God Controller로:
- 6개 서비스 주입: ArticleService, CommentService, FavoriteService, TagService, UserService, FollowService
- private 헬퍼 포함: `mapToResponseArticle()`, `mapToResponseComment()`, `updateTags()`, `didUserFavoriteThisArticle()`
- `findAll`에서 `this.articleService.repository.createQueryBuilder()`에 직접 접근
- 도메인 간 의존성: `@realworld/user/api/shared`에서 UserService와 FollowService 임포트

## 프론트엔드 컴포넌트

| 컴포넌트 | 라우트 | 목적 |
|----------|-------|------|
| HomeComponent | `/` | 피드 탭 (내 피드/전체 피드), 태그 클라우드 사이드바, 게시글 목록 |
| EditorComponent | `/editor`, `/editor/:slug` | 태그 입력이 있는 게시글 작성/수정 폼 |
| ViewArticleComponent | `/article/:slug` | 전체 게시글 뷰, 마크다운 렌더링, 댓글 섹션, 좋아요/팔로우 버튼 |
| ListArticlesComponent | (재사용) | 페이지네이션 게시글 목록 |
| ArticleItemComponent | (재사용) | 단일 게시글 미리보기 카드 |
| ArticleAuthorComponent | (재사용) | 작성자 아바타, 이름, 날짜, 팔로우 버튼 |

## 프론트엔드 서비스

- `ArticleService` — `BaseDataService<Article>` 상속, `@realworld/shared/foundation` 통한 CRUD
- `CommentService` — `BaseDataService<Comment>` 상속
- `TagService` — `BaseDataService<Tag>` 상속
- 각 서비스마다 대응하는 인터페이스 파일 존재 (`i-*.service.ts`)
