---
name: manage-issues
description: GitHub 이슈를 관리합니다. 이슈 생성, 조회, 업데이트, 라벨 관리 등을 수행합니다. "이슈 등록", "이슈 만들어줘", "이슈 업데이트", "진행상황 업데이트" 같은 요청에 자동으로 활성화됩니다.
argument-hint: [작업 유형: create/update/list/close] [이슈 제목 또는 번호]
allowed-tools: Read, Glob, Grep, Bash, Agent, AskUserQuestion
---

# GitHub 이슈 관리

$ARGUMENTS 요청을 처리합니다.

## 사전 설정

GitHub CLI(`gh`)가 PATH에 없을 수 있으므로 항상 다음을 선행:

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
```

레포지토리: `mwhong82/realworld-nx-nestjs-angular`

## 이슈 생성 워크플로우

### 1단계: 컨텍스트 수집

- 사용자 요청 분석하여 이슈 내용 파악
- 필요 시 코드베이스 탐색으로 관련 파일/라인 식별
- 기존 이슈 중복 확인: `gh issue list --repo $REPO --search "키워드"`

### 2단계: 라벨 확인/생성

사용 가능한 라벨 확인:

```bash
gh label list --repo $REPO
```

필요 시 라벨 생성:

```bash
gh label create "라벨명" --repo $REPO --color "HEX색상" --description "설명"
```

**기본 라벨 색상 가이드:**
| 라벨 | 색상 | 용도 |
|------|------|------|
| security | `D93F0B` (빨강) | 보안 이슈 |
| performance | `FBCA04` (노랑) | 성능 이슈 |
| architecture | `0075CA` (파랑) | 구조 개선 |
| testing | `7057FF` (보라) | 테스트 관련 |
| devops | `006B75` (청록) | CI/CD, 인프라 |
| tech-debt | `BFD4F2` (하늘) | 기술 부채 |

### 3단계: 이슈 생성

```bash
gh issue create --repo $REPO \
  --title "이모지 [카테고리] 제목" \
  --label "라벨1,라벨2" \
  --body "$(cat <<'EOF'
## 문제
문제 설명. 관련 파일과 라인 번호 포함.

## 해결 방안
1. 구체적인 해결 방법
2. 단계별 접근

## 심각도: CRITICAL/HIGH/MEDIUM/LOW / 노력: 낮음/중간/높음

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**심각도 이모지 가이드:**

- 🔴 CRITICAL/HIGH — 즉시 조치 필요
- 🟡 MEDIUM — 계획적으로 처리
- 🔵 LOW — 개선 사항
- 🟢 INFO — 참고/추적

### 4단계: 결과 보고

생성된 이슈 URL을 사용자에게 보고.

## 이슈 업데이트 워크플로우

### 진행상황 업데이트

```bash
gh issue comment $ISSUE_NUM --repo $REPO --body "$(cat <<'EOF'
## 진행상황 업데이트 (날짜)

### 완료된 항목
- [x] 완료 항목 설명

### 진행 중
- [ ] 진행 중인 항목

### 다음 단계
- [ ] 예정 항목

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 이슈 닫기

```bash
gh issue close $ISSUE_NUM --repo $REPO --comment "해결 완료: 설명"
```

## 이슈 조회

```bash
# 전체 목록
gh issue list --repo $REPO

# 라벨별 필터
gh issue list --repo $REPO --label "security"

# 특정 이슈 상세
gh issue view $ISSUE_NUM --repo $REPO
```

## 일괄 이슈 생성

여러 이슈를 생성할 때는 **병렬로 실행**하여 효율성을 높인다:

- 라벨 생성은 먼저 순차 실행
- 이슈 생성은 독립적이므로 병렬 실행 가능
- 각 이슈의 결과 URL을 수집하여 최종 보고

## 주의사항

- 이슈 생성 전 기존 이슈 중복 확인
- body에 HEREDOC 사용 시 `<<'EOF'`로 변수 확장 방지
- 라벨이 없으면 먼저 생성 후 이슈에 적용
- 심각도와 노력 수준을 항상 명시
