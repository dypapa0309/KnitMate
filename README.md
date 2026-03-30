# KnitMate

KnitMate는 "지금 몇 단인지 잃지 않게" 돕는 iOS 우선 온디바이스 뜨개질 앱 MVP입니다. 서버 없이 기기 로컬에만 데이터를 저장하고, 프로젝트별 단수/메모/히스토리/복구 흐름을 가장 단순하고 안정적으로 제공하는 데 집중했습니다.

## 기술 선택

- Expo + React Native + TypeScript
- Expo Router
- Zustand
- AsyncStorage

### 왜 Expo Router인가

파일 기반 라우팅이라서 홈, 상세, 작업, 히스토리, 수정 화면을 폴더 구조 그대로 관리할 수 있습니다. 나중에 인증, 설정, 동기화 화면이 추가돼도 구조를 무리 없이 확장하기 좋습니다.

### 왜 AsyncStorage인가

이번 MVP는 오프라인 단일 사용자, 비교적 작은 데이터셋, 빠른 구현 안정성이 중요합니다. 프로젝트와 히스토리를 JSON 단위로 저장해도 충분하고, 구현 난도가 낮아 초기 실패 지점이 적습니다.

추후 데이터가 커지거나 검색/필터/통계가 복잡해지면 `expo-sqlite` 또는 Supabase 기반 리포지토리로 교체할 수 있도록 저장 계층을 분리해 두었습니다.

## 주요 구조

```text
app/
  _layout.tsx              # 루트 네비게이션, 초기 hydrate
  index.tsx                # 홈 화면
  projects/
    new.tsx                # 프로젝트 생성
    [id].tsx               # 프로젝트 상세
    [id]/edit.tsx          # 프로젝트 수정
    [id]/work.tsx          # 작업 화면
    [id]/history.tsx       # 히스토리/복구 화면

src/
  components/
    ProjectCard.tsx
    ProjectForm.tsx
    HistoryLogItem.tsx
    WorkCounter.tsx
    StatusPill.tsx
    ui/
      Card.tsx
      EmptyState.tsx
      ErrorBanner.tsx
      PrimaryButton.tsx
      Screen.tsx
      SectionHeader.tsx
      TextField.tsx
  constants/
    colors.ts
    layout.ts
  hooks/
    useHydrateStore.ts
  services/
    storage/
      projectRepository.ts
  stores/
    useProjectStore.ts
  types/
    project.ts
  utils/
    format.ts
    id.ts
```

## MVP 포함 기능

- 홈에서 진행 중 프로젝트 목록과 최근 작업 프로젝트 우선 노출
- 프로젝트 생성/수정
- 프로젝트 상세 정보 확인
- 작업 화면에서 단수 증감과 빠른 메모 자동 저장
- 모든 변경 히스토리 기록
- 특정 시점 복구
- 앱 재시작 후 로컬 데이터 복원
- 저장 실패 시 에러 표시

## 실행 방법

1. 의존성 설치

```bash
npm install
```

2. 개발 서버 실행

```bash
npm start
```

3. iOS 실행

```bash
npx expo run:ios
```

또는 Expo Go/시뮬레이터에서 실행할 수 있습니다.

## 릴리스 파일

- Expo 앱 설정: `app.config.js`
- 앱 아이콘: `assets/icon.png`
- 스플래시 이미지: `assets/splash-icon.png`
- Netlify 홈페이지: `site/`
- App Store 메타데이터 템플릿: `config/storeMetadata.js`
- App Store 로케일별 복사용 텍스트: `app-store/metadata/`
- 스크린샷 촬영 가이드: `app-store/screenshots/README.md`
- EAS 설정: `eas.json`

## 홈페이지 배포

`knitemate.netlify.app`에 올릴 정적 사이트는 `site/` 폴더에 들어 있습니다.

- 마케팅 URL: `https://knitemate.netlify.app/`
- 지원 URL: `https://knitemate.netlify.app/support/`
- 개인정보처리방침 URL: `https://knitemate.netlify.app/privacy/`

`netlify.toml`이 포함되어 있어서 Netlify에서 publish directory를 별도로 잡지 않아도 `site/`가 기본 배포 대상이 됩니다.

로컬에서 간단히 확인하려면 예를 들어 아래처럼 정적 서버를 띄우면 됩니다.

```bash
python3 -m http.server 4173 --directory site
```

## 핵심 로직 설명

### 1. 즉시 UI 반영 + 자동 저장

Zustand store가 먼저 메모리 상태를 갱신해서 단수 변화가 즉시 화면에 반영됩니다. 이후 AsyncStorage 저장을 수행하고, 결과에 따라 `saveStatus`, `saveError`, `lastSavedAt`를 갱신합니다.

### 2. 히스토리 기록

프로젝트 생성, 수정, 단수 증가/감소, 메모 수정, 복구 모두 `ProjectLog`로 저장됩니다. 히스토리는 프로젝트별로 시간 역순으로 보여줍니다.

### 3. 복구 안전장치

복구를 실행할 때는 단순히 과거 상태를 덮는 대신, "복구 직전 현재 상태"를 별도 `restore` 로그로 남긴 뒤 저장합니다. 그래서 복구 후에도 다시 이전 상태를 추적할 수 있습니다.

## 데이터 모델

### Project

- `id`
- `title`
- `notes`
- `yarnInfo`
- `needleInfo`
- `currentRow`
- `createdAt`
- `updatedAt`
- `lastWorkedAt`
- `archived`
- `accentColor?`
- `tag?`

### ProjectLog

- `id`
- `projectId`
- `actionType`
- `beforeValue`
- `afterValue`
- `note`
- `createdAt`

## 향후 Supabase 확장 포인트

현재 store는 직접 네트워크를 호출하지 않고 `src/services/storage/projectRepository.ts`를 통해 저장 계층을 사용합니다. 나중에는 아래 방식으로 확장할 수 있습니다.

1. `ProjectRepository` 인터페이스를 유지한 채 `SupabaseProjectRepository` 추가
2. 로그인 상태에 따라 로컬 저장소와 원격 저장소를 교체하거나 동기화 전략 추가
3. `Project`와 `ProjectLog` 타입을 그대로 Supabase 테이블 스키마로 매핑
4. 오프라인 우선이 필요하면 로컬 저장 후 백그라운드 동기화 큐 추가

즉, 현재 MVP는 "UI/상태관리"와 "저장소 구현"이 분리되어 있어서 저장 방식 교체가 비교적 쉽습니다.

## 안정성 메모

- 음수 단수는 저장되지 않도록 방지합니다.
- 저장 중/저장 완료/저장 오류 상태를 작업 화면에 명시합니다.
- 프로젝트가 없거나 ID가 잘못된 경우 빈 상태 화면을 보여줍니다.
- JSON 파싱 실패 시 기본 빈 데이터로 안전하게 복구합니다.

## App Store 제출 체크리스트

### 지금 바로 끝낸 것

- iOS 시뮬레이터 빌드와 앱 실행 확인
- 앱 아이콘 및 스플래시 자산 연결
- App Store 메타데이터 템플릿 추가
- EAS build/submit 프로필 추가

### 제출 전에 꼭 채워야 하는 것

1. Netlify에 `site/`를 실제 배포해서 `https://knitemate.netlify.app/`를 오픈
2. 실제 App Store 스크린샷 4장 이상 준비
3. Apple Developer 계정에서 `com.knitmate.app` 번들 ID와 App Store Connect 앱 생성
4. App Privacy 답변 입력
5. 내부 TestFlight 테스트 후 심사 제출

### 권장 제출 순서

1. 시뮬레이터와 실제 iPhone에서 핵심 흐름 검수
2. `eas build --platform ios --profile preview`
3. TestFlight 내부 배포
4. 메타데이터/스크린샷 입력
5. `eas build --platform ios --profile production`
6. `eas submit --platform ios --profile production`

### EAS 사용 예시

```bash
npx eas login
npx eas build --platform ios --profile preview
npx eas build --platform ios --profile production
npx eas submit --platform ios --profile production
```
