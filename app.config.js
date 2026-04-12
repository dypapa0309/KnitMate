const { withAndroidManifest } = require("@expo/config-plugins");
const { storeMetadata } = require("./config/storeMetadata");

const withNoCameraPermission = (config) =>
  withAndroidManifest(config, (c) => {
    const perms = c.modResults.manifest["uses-permission"] ?? [];
    c.modResults.manifest["uses-permission"] = perms.filter(
      (p) => p.$["android:name"] !== "android.permission.CAMERA",
    );
    return c;
  });

const primaryLocale = storeMetadata.locales["ko-KR"];

module.exports = withNoCameraPermission({
  name: primaryLocale.name,
  slug: "knitmate",
  scheme: "knitmate",
  version: "1.0.4",
  orientation: "portrait",
  userInterfaceStyle: "light",
  description: primaryLocale.description,
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#F7F3EE",
  },
  plugins: [
    "expo-router",
    [
      "expo-image-picker",
      {
        photosPermission: "완료 사진을 고르기 위해 사진 보관함 접근이 필요해요.",
      },
    ],
  ],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.knitmate.app",
    buildNumber: "8",
    infoPlist: {
      NSPhotoLibraryUsageDescription: "피드와 뜨모저모에 올릴 사진을 고르기 위해 사진 보관함 접근이 필요해요.",
      NSPhotoLibraryAddUsageDescription: "선택한 이미지를 게시 흐름에서 사용하기 위해 사진 보관함 접근이 필요해요.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#F7F3EE",
    },
    package: "com.knitmate.app",
    versionCode: 10,
    compileSdkVersion: 35,
    targetSdkVersion: 35,
  },
  extra: {
    localOnly: false,
    storeMetadataPath: "./config/storeMetadata.js",
    eas: {
      projectId: "2566131b-d4e4-4c72-bd13-8a8739b99d36",
    },
  },
});
