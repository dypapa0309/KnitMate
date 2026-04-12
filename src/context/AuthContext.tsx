import { Session, User } from "@supabase/supabase-js";
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from "react";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";

import { signInWithApple as signInWithAppleAction, signInWithGoogle as signInWithGoogleAction } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { SocialProfile } from "@/types/project";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: SocialProfile | null;
  loading: boolean;
  busy: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (input: { username: string; bio: string; avatarUri?: string | null }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const PROFILE_AVATAR_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || "feed-snapshots";

function mapProfile(row: Record<string, unknown>): SocialProfile {
  return {
    id: String(row.id),
    username: String(row.username ?? "KnitMate 메이트"),
    bio: row.bio ? String(row.bio) : undefined,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const user = session?.user ?? null;

  const refreshProfile = async () => {
    if (!user || !isSupabaseConfigured) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error || !data) {
      setProfile(null);
      return;
    }

    setProfile(mapProfile(data as Record<string, unknown>));
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) {
          return;
        }

        setSession(data.session ?? null);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setSession(null);
      })
      .finally(() => {
        if (!mounted) {
          return;
        }

        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return;
      }

      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [user?.id]);

  async function withBusy<T>(action: () => Promise<T>) {
    setBusy(true);
    try {
      return await action();
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(userId: string, avatarUri: string) {
    const fileExt = avatarUri.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = fileExt === "png" ? "image/png" : "image/jpeg";
    const objectPath = `avatars/${userId}/profile.${fileExt}`;
    const base64 = await FileSystem.readAsStringAsync(avatarUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { error } = await supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .upload(objectPath, decode(base64), {
        contentType,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(objectPath);
    return data.publicUrl;
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      busy,
      signIn: async (email, password) =>
        withBusy(async () => {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            throw error;
          }
        }),
      signUp: async (email, password, username) =>
        withBusy(async () => {
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error) {
            throw error;
          }

          const signedUpUser = data.user;
          if (!signedUpUser) {
            return;
          }

          const { error: profileError } = await supabase.from("profiles").upsert({
            id: signedUpUser.id,
            username: username.trim() || email.split("@")[0] || "KnitMate 메이트",
            bio: null,
            avatar_url: null,
          });

          if (profileError) {
            throw profileError;
          }
        }),
      signInWithGoogle: async () =>
        withBusy(async () => {
          await signInWithGoogleAction();
        }),
      signInWithApple: async () =>
        withBusy(async () => {
          await signInWithAppleAction();
        }),
      signOut: async () =>
        withBusy(async () => {
          const { error } = await supabase.auth.signOut();
          if (error) {
            throw error;
          }
          setProfile(null);
        }),
      resendConfirmationEmail: async (email) =>
        withBusy(async () => {
          const trimmedEmail = email.trim();
          if (!trimmedEmail) {
            throw new Error("이메일을 먼저 입력해 주세요.");
          }

          const { error } = await supabase.auth.resend({
            type: "signup",
            email: trimmedEmail,
          });

          if (error) {
            throw error;
          }
        }),
      updateProfile: async ({ username, bio, avatarUri }) =>
        withBusy(async () => {
          if (!user) {
            throw new Error("로그인 후 다시 시도해 주세요.");
          }

          const nextAvatarUrl =
            avatarUri === undefined
              ? profile?.avatarUrl ?? null
              : avatarUri
                ? await uploadAvatar(user.id, avatarUri)
                : null;

          const { error } = await supabase.from("profiles").upsert({
            id: user.id,
            username: username.trim() || user.email?.split("@")[0] || "KnitMate 메이트",
            bio: bio.trim() || null,
            avatar_url: nextAvatarUrl,
          });

          if (error) {
            throw error;
          }

          await refreshProfile();
        }),
      refreshProfile,
    }),
    [busy, loading, profile, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
