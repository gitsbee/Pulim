# 풀림 (Pulim)

풀림은 수학과 영어를 연습하고 담벼락에서 질문과 풀이를 나누는 학습 서비스입니다. React, TypeScript, Firebase Authentication과 Firestore를 사용합니다.

- 상단의 풀림·수학·영어 아이콘으로 이동합니다. 풀림의 담벼락에서 글과 댓글을 읽고 작성할 수 있습니다.
- 수학에서는 문제공방의 문제 생성·채점·해설·필기 기능을 사용합니다. 영어에서는 단어장과 암기·선택·입력 연습을 제공합니다.
- 오늘의 문제는 한국 시간 기준 날짜마다 과목별 3문제가 정해집니다. 로그인하면 첫 제출 결과가 계정에 저장됩니다.
- 내 기록에서 로그인 후 푼 수학·영어 문제의 이름과 결과를 기기 간 확인합니다. 진행 중인 초안, 필기와 복습 상태는 사용한 브라우저에 저장됩니다.
- 오늘의 문제를 모두 푼 뒤 선택적으로 점수를 공개하면 과목별 온라인 랭킹에 표시됩니다. 채점은 브라우저에서 이루어집니다.
- 담벼락에는 글·댓글·좋아요·싫어요·리포스트와 해시태그 검색이 있습니다. 검색 대상은 현재 불러온 게시물입니다.
- 이메일과 비밀번호로 로그인합니다. 공개 프로필의 고유 핸들은 가입 시 설정합니다.

학습 도구 구성, 데이터 저장 범위와 운영 방식은 [풀림 통합 설계](docs/PULLEEM.md)를 참고하세요.

## 로컬 실행

Node.js 22.12 이상이 필요합니다.

```sh
npm ci
cp .env.example .env.local
# .env.local에 Firebase 웹 앱 설정 네 항목을 입력합니다.
npm run dev
```

기존 `.env.local`이 있다면 유지하고 필요한 항목만 편집하세요. 로컬 주소 뒤에 `/Pulim/`을 붙여 접속합니다. Firebase 설정을 바꾼 후 개발 서버를 다시 시작하세요.

| 환경 변수 | Firebase 웹 앱 설정 |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

이 값은 웹 앱의 공개 설정으로 빌드에 포함됩니다. 서비스 계정 개인 키나 비밀번호는 넣지 마세요. Authentication에서 이메일·비밀번호 로그인을 사용하고 Firestore 보안 규칙으로 데이터 접근을 제어합니다.

## 검증

```sh
npm test
npm run build
npm run test:rules
npx playwright install chromium
npm run test:e2e
```

보안 규칙 테스트에는 Java 21 이상이 필요합니다. 브라우저 테스트는 데모 Auth·Firestore 에뮬레이터를 사용합니다. 시스템 Chromium을 사용할 때는 `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e`로 실행할 수 있습니다.

## GitHub Pages 배포

저장소 이름을 기준으로 Pages 주소는 `https://gitsbee.github.io/Pulim/`이며, Vite 기본 경로도 `/Pulim/`입니다. `beta`에 push하면 GitHub Actions가 검증·빌드 후 Pages에 배포합니다. 저장소의 Pages 소스는 GitHub Actions로 설정하고 `github-pages` 환경에서 `beta`를 허용해야 합니다. Actions의 네 `VITE_FIREBASE_*` 값과 Firebase Authentication의 `gitsbee.github.io` 승인 도메인도 필요합니다.

Firestore 규칙은 Pages 배포로 자동 갱신되지 않습니다. 규칙을 변경한 경우 [firestore.rules](firestore.rules)를 Firebase 콘솔에 게시하세요. 기존 규칙이 이미 적용된 프로젝트는 배포 후 로그인, 담벼락, 두 과목의 문제 풀이와 다른 기기에서의 기록, 랭킹 공개를 확인하세요.
