import AsyncStorage from "@react-native-async-storage/async-storage";

const HAPTICS_KEY = "knitmate/settings/haptics/v1";

export async function getHapticsEnabled() {
  const value = await AsyncStorage.getItem(HAPTICS_KEY);
  return value !== "off";
}

export async function setHapticsEnabled(enabled: boolean) {
  await AsyncStorage.setItem(HAPTICS_KEY, enabled ? "on" : "off");
}
