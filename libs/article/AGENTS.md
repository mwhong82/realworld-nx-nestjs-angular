<!-- Parent: ../../CLAUDE.md -->
<!-- Generated: 2026-03-11 -->

# 게시글 도메인 (Article Domain)

## 목적
게시글, 댓글, 좋아요, 태그에 관한 모든 것 — 백엔드 API와 프론트엔드 UI 모두 포함.

## 하위 디렉토리

| 디렉토리 | Nx 프로젝트 | 목적 |
|----------|-----------|------|
| `api/handlers/` | article-api-handlers | REST 컨트롤러 — 게시글 관련 모든 엔드포인트 |
| `api/shared/` | article-api-shared | TypeORM 엔티티 + 서비스 (Article, Comment, Favorite, Tag) |
| `api-interfaces/` | article-api-interfaces | DTO 및 API 요청/응답 계약 |
| `feature/` | article-feature | Angular 컴포넌트 (홈, 에디터, 게시글 뷰, 목록) |
| `shared/` | article-shared | 프론트엔드 HTTP 서비스 + 인터페이스 |

## 백엔드 아키텍처

### 엔티티 (api/shared/)

| 엔티티 | 파일 | 주요 필드 | 관계 |
|--------|------|----------|------|
| Article | `article.entity.ts` | slug (고유), title, description, body, authorId, tagList (JSON) | User에 속함 |
| Comment | `comment.entity.ts` | body, authorId, articleSlug | User, Article에 속함 |
| Favorite | `favorite.entity.ts` | userId, articleSlug | User, Article에 속함 |
| Tag | `tag.entity.ts` | name, count | 독립 |

모든 엔티티는 `BaseEntity`를 상속 (UUID PK, createdAt, updatedAt, deletedDate).

### 서비스 (api/shared/)

모든 서비스가 `BaseService<T>`를 상속 — TypeORM Repository로의 순수 위임. 서비스에 커스텀 비즈니스 로직 없음. 복잡한 로직은 컨트롤러에 존재.

### 컨트롤러 (api/handlers/)

`ArticleApiHandlersController` (285줄)가 모든 게시글 도메인 엔드포인트를 처리:

| 메서드 | 엔드포인트 | 인증 | 설명 |
|--------|----------|------|------|
| POST | `/articles` | 필수 | 게시글 생성 |
| PUT | `/articles/:slug` | 필수 | 게시글 수정 |
| DELETE | `/articles/:slug` | 필수 | 게시글 삭제 |
| GET | `/articles/:slug` | 선택 | 단일 게시글 조회 |
| GET | `/articles` | 선택 | 게시글 목록 (author, tag, favorited 필터링) |
| GET | `/articles/feed` | 필수 | 팔로우한 작성자의 피드 |
| POST | `/articles/:slug/favorite` | 필수 | 좋아요 |
| DELETE | `/articles/:slug/favorite` | 필수 | 좋아요 취소 |
| GET | `/articles/:slug/comments` | 선택 | 댓글 목록 |
| POST | `/articles/:slug/comments` | 필수 | 댓글 작성 |
| DELETE | `/articles/:slug/comments/:id` | 필수 | 댓글 삭제 |
| GET | `/tags` | 공개 | 전체 태그 목록 |

**주의**: 이 컨트롤러는 6개 서비스를 주입받고 (Article, Comment, Favorite, Tag, User, Follow) private 헬퍼 메서드를 포함 (mapToResponseArticle, mapToResponseComment, updateTags, didUserFavoriteThisArticle). `findAll` 메서드에서 `service.repository.createQueryBuilder()`에 직접 접근.

## 프론트엔드 아키텍처 (feature/)

| 컴포넌트 | 라우트 | 목적 |
|----------|-------|------|
| HomeComponent | `/` | 게시글 피드, 태그 클라우드, 탭 네비게이션 |
| EditorComponent | `/editor`, `/editor/:slug` | 게시글 작성/수정 |
| ViewArticleComponent | `/article/:slug` | 게시글 상세 + 댓글 + 좋아요 |
| ListArticlesComponent | (공유) | 페이지네이션 게시글 목록 |
| ArticleItemComponent | (공유) | 단일 게시글 카드 |
| ArticleAuthorComponent | (공유) | 작성자 정보 + 팔로우 버튼 |

### 프론트엔드 서비스 (shared/)
- `ArticleService` — `BaseDataService<Article>` 상속, 게시글 HTTP CRUD
- `CommentService` — `BaseDataService<Comment>` 상속, 댓글 HTTP CRUD
- `TagService` — `BaseDataService<Tag>` 상속, 태그 HTTP CRUD
- 각 서비스마다 인터페이스 파일 존재 (`i-*.service.ts`)

## AI 에이전트 안내

### 이 디렉토리에서 작업할 때
- 백엔드 변경: `api/shared/`에서 엔티티 수정, `api/handlers/`에서 컨트롤러 수정, `api-interfaces/`에서 DTO 수정
- 프론트엔드 변경: `feature/`에서 컴포넌트 수정, `shared/`에서 서비스 수정
- 컨트롤러가 God Object — 6개 주입 서비스 모두에 미치는 영향 고려
- `findAll`은 원시 `createQueryBuilder` 사용 — 쿼리 수정 시 주의

### 테스트
```bash
npx nx test article-api-shared       # 백엔드 서비스
npx nx test article-api-handlers     # 백엔드 컨트롤러
npx nx test article-feature          # 프론트엔드 컴포넌트
npx nx test article-shared           # 프론트엔드 서비스
```

### 의존성
- 백엔드: `@realworld/shared/api/foundation` (BaseService, BaseEntity), `@realworld/user/api/shared` (UserService, FollowService)
- 프론트엔드: `@realworld/shared/foundation` (BaseDataService), `@realworld/shared/configuration`
