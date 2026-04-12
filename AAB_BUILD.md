# KnitMate AAB 빌드 가이드

> 이 가이드를 순서대로 따르면 빌드 실패 없이 AAB 파일을 만들 수 있어요.
> 작업 디렉토리: `/private/tmp/knitmate-mvp-3da8eb8`

---

## 현황 점검 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| EAS 로그인 | ✅ | sangbinlee0214 (dypapa0309@gmail.com) |
| EAS CLI | ✅ | 18.5.0 (최신 18.6.0 있음, 지장 없음) |
| 아이콘 (1024×1024) | ✅ | assets/icon.png |
| 스플래시 (2048×2048) | ✅ | assets/splash-icon.png |
| Android 패키지명 | ✅ | com.knitmate.app |
| 핵심 의존성 | ✅ | supabase, expo-auth-session, url-polyfill 등 전부 node_modules에 있음 |
| **app.config.js → EAS projectId** | ❌ | 없음 → EAS 원격 버전 관리 실패 |
| **eas.json → android buildType** | ❌ | 없음 → AAB 대신 APK가 빌드됨 |
| **EAS 환경변수 (Supabase)** | ❌ | production에 미등록 → 앱에서 Supabase 연동 안 됨 |

---

## STEP 1 — app.config.js 수정 (EAS projectId 추가)

`extra` 블록에 `eas.projectId`를 추가해야 EAS가 올바른 프로젝트에 빌드를 연결해요.

```js
// app.config.js — extra 섹션을 아래처럼 교체
extra: {
  localOnly: false,                        // ← true → false 변경
  storeMetadataPath: "./config/storeMetadata.js",
  eas: {
    projectId: "2566131b-d4e4-4c72-bd13-8a8739b99d36",
  },
},
```

---

## STEP 2 — eas.json 수정 (android AAB 빌드 타입 지정)

```json
{
  "cli": {
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {}
    }
  }
}
```

> `appVersionSource: "remote"` → `"local"` 로 바꾸는 이유:
> worktree에서 빌드할 때 EAS 원격 버전 소스는 프로젝트 초기화(`eas init`)가 필요해요.
> `"local"`로 하면 `app.config.js`의 `versionCode: 8`이 그대로 사용됩니다.

---

## STEP 3 — EAS 환경변수 등록 (Supabase 키)

아래 세 변수를 EAS production 환경에 등록해야 빌드된 앱에서 Supabase가 정상 작동해요.
`.env` 파일에 있는 값을 그대로 사용하면 됩니다.

```bash
# 워크트리 폴더에서 실행
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL \
  --value "https://jdsxwngntbkxpncjprsg.supabase.co" --type string --visibility plaintext

eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkc3h3bmdudGJreHBuY2pwcnNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MTk5NjAsImV4cCI6MjA5MDk5NTk2MH0.1NDdHvAUjENJqThA23etLQNZ6ZIMYRuphS4JY_DZPBY" \
  --type string --visibility sensitive

eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET \
  --value "feed-snapshots" --type string --visibility plaintext
```

> 이미 등록돼 있으면 `env:create` 대신 `env:update`를 사용하세요.

---

## STEP 4 — 빌드 실행

```bash
cd /private/tmp/knitmate-mvp-3da8eb8

eas build --platform android --profile production
```

- 키스토어가 없으면 EAS가 자동 생성해서 관리해 줘요 (권장)
- 빌드 완료 후 EAS 대시보드 또는 터미널에서 `.aab` 다운로드 링크가 나와요

---

## STEP 5 — (선택) 로컬에서 TypeScript 사전 점검

빌드 전에 타입 오류를 미리 잡고 싶다면:

```bash
cd /private/tmp/knitmate-mvp-3da8eb8
npx tsc --noEmit
```

---

## 체크리스트 요약

- [ ] `app.config.js` — `extra.eas.projectId` 추가, `localOnly: false`
- [ ] `eas.json` — `production.android.buildType: "app-bundle"`, `appVersionSource: "local"`
- [ ] EAS env:create — 3개 Supabase 환경변수 production에 등록
- [ ] `eas build --platform android --profile production` 실행
