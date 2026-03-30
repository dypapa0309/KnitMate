const storeMetadata = {
  defaultLocale: "ko-KR",
  locales: {
    "ko-KR": {
      name: "KnitMate",
      subtitle: "단수를 잃지 않는 뜨개질 도구",
      keywords: ["뜨개질", "단수", "니팅", "메모", "카운터", "knitting"],
      description:
        "KnitMate는 뜨개질 작업 중 지금 몇 단인지 놓치지 않도록 도와주는 온디바이스 작업 도구입니다. 프로젝트별 현재 단수, 메모, 변경 이력을 로컬에 저장하고 필요할 때 특정 시점으로 복구할 수 있습니다. 서버 없이 조용하고 안정적인 기록 경험에 집중했습니다.",
      promotionalText:
        "작업 흐름을 끊지 않고 단수, 메모, 복구 이력을 한 화면에서 관리하세요.",
      supportUrl: "https://knitemate.netlify.app/support/",
      marketingUrl: "https://knitemate.netlify.app/",
      privacyUrl: "https://knitemate.netlify.app/privacy/",
      reviewNotes:
        "로그인 없이 실행됩니다. 테스트 계정이 필요 없고, 모든 데이터는 기기 로컬 저장소에만 저장됩니다.",
      releaseNotes: "첫 공개 버전입니다. 프로젝트별 단수 기록, 메모, 히스토리 복구를 지원합니다.",
    },
    "en-US": {
      name: "KnitMate",
      subtitle: "A steady knitting row tracker",
      keywords: ["knitting", "rows", "counter", "notes", "offline", "craft"],
      description:
        "KnitMate is a calm, local-first knitting companion built to help you avoid losing your current row. Track row counts, project notes, and recovery history per project without needing a server or account.",
      promotionalText:
        "Track rows, save notes, and recover previous states without breaking your knitting flow.",
      supportUrl: "https://knitemate.netlify.app/support/",
      marketingUrl: "https://knitemate.netlify.app/",
      privacyUrl: "https://knitemate.netlify.app/privacy/",
      reviewNotes:
        "No login is required. The app stores project data only on-device and does not require a test account.",
      releaseNotes:
        "Initial release with project-based row tracking, notes, local history, and restore support.",
    },
  },
  content: {
    primaryCategory: "LIFESTYLE",
    secondaryCategory: "PRODUCTIVITY",
    ageRatingNotes: "No user-generated public content, web access, or external purchases.",
    privacySummary:
      "Current MVP stores project data locally on device and does not send user data to a server.",
  },
};

module.exports = {
  storeMetadata,
};
