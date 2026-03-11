# API 문서

기본 URL: `http://localhost:3000`

모든 엔드포인트는 JSON을 반환. 인증은 `Authorization: Token <jwt>` 헤더로 JWT 토큰 전달.

## 인증

### 로그인
```
POST /users/login
```
**인증**: 없음 (공개)

**요청 본문**:
```json
{
  "user": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

**응답** `200`:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "bio": "...",
    "image": "https://...",
    "token": "jwt-token-here"
  }
}
```

### 회원가입
```
POST /users
```
**인증**: 없음 (공개)

**요청 본문**:
```json
{
  "user": {
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123"
  }
}
```

**응답** `201`: 로그인 응답과 동일한 형식.

## 현재 사용자

### 현재 사용자 조회
```
GET /user
```
**인증**: 필수

**응답** `200`: 사용자 객체 (로그인 응답과 동일한 형태).

### 사용자 정보 수정
```
PUT /users
```
**인증**: 필수

**요청 본문** (모든 필드 선택):
```json
{
  "user": {
    "email": "newemail@example.com",
    "username": "newusername",
    "bio": "수정된 자기소개",
    "image": "https://new-image-url.com",
    "password": "newpassword"
  }
}
```

**응답** `200`: 수정된 사용자 객체.

## 프로필

### 프로필 조회
```
GET /profiles/:username
```
**인증**: 선택 (인증 여부에 따라 `following` 필드 결정)

**응답** `200`:
```json
{
  "profile": {
    "username": "jake",
    "bio": "...",
    "image": "https://...",
    "following": false
  }
}
```

### 팔로우
```
POST /profiles/:username/follow
```
**인증**: 필수

**응답** `200`: `following: true`가 포함된 프로필 객체.

### 언팔로우
```
DELETE /profiles/:username/follow
```
**인증**: 필수

**응답** `200`: `following: false`가 포함된 프로필 객체.

## 게시글

### 게시글 목록
```
GET /articles
```
**인증**: 선택 (인증 여부에 따라 `favorited` 필드 결정)

**쿼리 파라미터**:
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `author` | 문자열 | 작성자 사용자명으로 필터링 |
| `tag` | 문자열 | 태그로 필터링 |
| `favorited` | 문자열 | 좋아요한 사용자명으로 필터링 |
| `limit` | 숫자 | 결과 수 제한 (기본값: 20) |
| `offset` | 숫자 | 페이지네이션 오프셋 (기본값: 0) |

**응답** `200`:
```json
{
  "articles": [
    {
      "slug": "article-title-uuid",
      "title": "게시글 제목",
      "description": "짧은 설명",
      "body": "전체 게시글 내용...",
      "tagList": ["태그1", "태그2"],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "favorited": false,
      "favoritesCount": 5,
      "author": {
        "username": "jake",
        "bio": "...",
        "image": "https://...",
        "following": false
      }
    }
  ],
  "articlesCount": 100
}
```

### 피드 조회
```
GET /articles/feed
```
**인증**: 필수

팔로우한 작성자의 게시글 반환. `limit`과 `offset` 파라미터 지원.

**응답** `200`: 게시글 목록과 동일한 형태.

### 단일 게시글 조회
```
GET /articles/:slug
```
**인증**: 선택

**응답** `200`:
```json
{
  "article": { ... }
}
```

### 게시글 작성
```
POST /articles
```
**인증**: 필수

**요청 본문**:
```json
{
  "article": {
    "title": "새 게시글",
    "description": "짧은 설명",
    "body": "마크다운 형식의 전체 게시글 내용",
    "tagList": ["태그1", "태그2"]
  }
}
```

**응답** `201`: 생성된 게시글 객체.

### 게시글 수정
```
PUT /articles/:slug
```
**인증**: 필수 (작성자만 가능)

**요청 본문** (모든 필드 선택):
```json
{
  "article": {
    "title": "수정된 제목",
    "description": "수정된 설명",
    "body": "수정된 내용"
  }
}
```

**응답** `200`: 수정된 게시글 객체.

### 게시글 삭제
```
DELETE /articles/:slug
```
**인증**: 필수 (작성자만 가능)

**응답** `200`: 성공 응답.

## 좋아요

### 좋아요
```
POST /articles/:slug/favorite
```
**인증**: 필수

**응답** `200`: 업데이트된 `favorited`와 `favoritesCount`가 포함된 게시글 객체.

### 좋아요 취소
```
DELETE /articles/:slug/favorite
```
**인증**: 필수

**응답** `200`: 업데이트된 `favorited`와 `favoritesCount`가 포함된 게시글 객체.

## 댓글

### 댓글 목록
```
GET /articles/:slug/comments
```
**인증**: 선택

**응답** `200`:
```json
{
  "comments": [
    {
      "id": "uuid",
      "body": "댓글 텍스트",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "author": {
        "username": "jake",
        "bio": "...",
        "image": "https://...",
        "following": false
      }
    }
  ]
}
```

### 댓글 작성
```
POST /articles/:slug/comments
```
**인증**: 필수

**요청 본문**:
```json
{
  "comment": {
    "body": "좋은 글이네요!"
  }
}
```

**응답** `201`: 생성된 댓글 객체.

### 댓글 삭제
```
DELETE /articles/:slug/comments/:id
```
**인증**: 필수 (댓글 작성자만 가능)

**응답** `200`: 성공 응답.

## 태그

### 태그 목록
```
GET /tags
```
**인증**: 없음 (공개)

**응답** `200`:
```json
{
  "tags": ["태그1", "태그2", "태그3"]
}
```

## 에러 응답

모든 에러는 일관된 형식을 따름:

```json
{
  "statusCode": 404,
  "message": "게시글을 찾을 수 없습니다",
  "error": "Not Found"
}
```

| 상태 코드 | 의미 |
|-----------|------|
| 400 | 잘못된 요청 — 유효성 검사 에러 |
| 401 | 미인증 — JWT 없음 또는 유효하지 않음 |
| 404 | 찾을 수 없음 — 리소스가 존재하지 않음 |
| 409 | 충돌 — 중복 이메일/사용자명/slug |
| 500 | 서버 내부 에러 |

## 소스 코드 참조

| 엔드포인트 그룹 | 컨트롤러 파일 |
|----------------|-------------|
| 사용자, 프로필, 팔로우 | `libs/user/api/handlers/src/lib/user-api-handlers.controller.ts` |
| 게시글, 댓글, 좋아요, 태그 | `libs/article/api/handlers/src/lib/article-api-handlers.controller.ts` |
