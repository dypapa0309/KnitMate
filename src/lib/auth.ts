import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

try {
  WebBrowser.maybeCompleteAuthSession();
} catch {
  // OAuth 세션 정리는 앱 시작을 막지 않도록 무시합니다.
}

function getUrlParam(url: URL, key: string) {
  const fromQuery = url.searchParams.get(key);
  if (fromQuery) {
    return fromQuery;
  }

  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  if (!hash) {
    return null;
  }

  return new URLSearchParams(hash).get(key);
}

export async function signInWithOAuth(provider: "google" | "apple") {
  if (!isSupabaseConfigured) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const redirectTo = makeRedirectUri({ scheme: "knitmate", path: "auth/callback" });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error(`${provider.toUpperCase()}_URL_MISSING`);
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" || !result.url) {
    return;
  }

  const callbackUrl = new URL(result.url);
  const authError = getUrlParam(callbackUrl, "error_description") || getUrlParam(callbackUrl, "error");
  if (authError) {
    throw new Error(authError);
  }

  const accessToken = getUrlParam(callbackUrl, "access_token");
  const refreshToken = getUrlParam(callbackUrl, "refresh_token");

  if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      throw sessionError;
    }

    return;
  }

  const code = getUrlParam(callbackUrl, "code");
  if (code) {
    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    if (exchanged.error) {
      throw exchanged.error;
    }
    return;
  }

  throw new Error("OAUTH_RESULT_MISSING");
}

export async function signInWithGoogle() {
  return signInWithOAuth("google");
}

export async function signInWithApple() {
  return signInWithOAuth("apple");
}
