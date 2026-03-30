const { storeMetadata } = require("./config/storeMetadata");

const primaryLocale = storeMetadata.locales["ko-KR"];

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: primaryLocale.name,
  slug: "knitmate",
  scheme: "knitmate",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  description: primaryLocale.description,
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#F7F3EE",
  },
  plugins: ["expo-router"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.knitmate.app",
    buildNumber: "1",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#F7F3EE",
    },
    package: "com.knitmate.app",
    versionCode: 1,
  },
  extra: {
    localOnly: true,
    storeMetadataPath: "./config/storeMetadata.js",
  },
};
