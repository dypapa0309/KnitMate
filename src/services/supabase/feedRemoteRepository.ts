import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { FeedComment, FeedPost, FeedPostChannel, ProjectSnapshot, SocialProfile } from "@/types/project";

type FeedRemotePayload = {
  snapshots: ProjectSnapshot[];
  posts: FeedPost[];
  comments: FeedComment[];
  profiles: SocialProfile[];
};

const SUPABASE_STORAGE_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || "feed-snapshots";

function mapProfile(row: Record<string, unknown>): SocialProfile {
  return {
    id: String(row.id),
    username: String(row.username ?? "KnitMate 메이트"),
    bio: row.bio ? String(row.bio) : undefined,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapSnapshot(row: Record<string, unknown>): ProjectSnapshot {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title ?? ""),
    row: Number(row.row ?? 0),
    note: String(row.note ?? ""),
    yarnInfo: String(row.yarn_info ?? ""),
    needleInfo: String(row.needle_info ?? ""),
    methodSummary: String(row.method_summary ?? ""),
    photoUri: row.photo_url ? String(row.photo_url) : undefined,
    hashtags: Array.isArray(row.hashtags) ? row.hashtags.map((item) => String(item)) : [],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapPost(row: Record<string, unknown>): FeedPost {
  const type = (row.type as FeedPost["type"]) ?? "share";
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    snapshotId: String(row.snapshot_id),
    channel: (row.channel as FeedPostChannel) ?? (type === "question" ? "community" : "feed"),
    authorUserId: row.author_user_id ? String(row.author_user_id) : undefined,
    authorName: String(row.author_name ?? "KnitMate 메이트"),
    type,
    title: String(row.title ?? ""),
    caption: String(row.caption ?? ""),
    likeCount: Number(row.like_count ?? 0),
    hashtags: Array.isArray(row.hashtags) ? row.hashtags.map((item) => String(item)) : [],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapComment(row: Record<string, unknown>): FeedComment {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    parentCommentId: row.parent_comment_id ? String(row.parent_comment_id) : undefined,
    authorUserId: row.author_user_id ? String(row.author_user_id) : undefined,
    authorName: String(row.author_name ?? "KnitMate 메이트"),
    body: String(row.body ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

async function fetchProfiles(profileIds: string[]) {
  if (!profileIds.length) {
    return [];
  }

  const { data, error } = await supabase.from("profiles").select("*").in("id", profileIds);
  if (error) {
    throw error;
  }

  return ((data ?? []) as Record<string, unknown>[]).map(mapProfile);
}

async function uploadSnapshotPhoto(snapshot: ProjectSnapshot, ownerUserId?: string): Promise<string | undefined> {
  if (!snapshot.photoUri) {
    return undefined;
  }

  const fileExt = snapshot.photoUri.split(".").pop()?.toLowerCase() || "jpg";
  const contentType = fileExt === "png" ? "image/png" : "image/jpeg";
  const objectPath = ownerUserId
    ? `${ownerUserId}/${snapshot.projectId}/${snapshot.id}.${fileExt}`
    : `${snapshot.projectId}/${snapshot.id}.${fileExt}`;
  const base64 = await FileSystem.readAsStringAsync(snapshot.photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(objectPath, decode(base64), {
      contentType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

export const feedRemoteRepository = {
  isConfigured: () => isSupabaseConfigured,

  async fetchChannel(channel: FeedPostChannel): Promise<FeedRemotePayload> {
    if (!isSupabaseConfigured) {
      return { snapshots: [], posts: [], comments: [], profiles: [] };
    }

    const { data: postData, error: postError } = await supabase
      .from("feed_posts")
      .select("*")
      .eq("channel", channel)
      .order("created_at", { ascending: false })
      .limit(60);

    if (postError) {
      throw postError;
    }

    const posts = ((postData ?? []) as Record<string, unknown>[]).map(mapPost);
    const snapshotIds = [...new Set(posts.map((post) => post.snapshotId))];
    const postIds = posts.map((post) => post.id);
    const profileIds = [...new Set(posts.map((post) => post.authorUserId).filter(Boolean).map((value) => String(value)))];

    const [snapshotResult, commentResult, profiles] = await Promise.all([
      snapshotIds.length ? supabase.from("feed_snapshots").select("*").in("id", snapshotIds) : Promise.resolve({ data: [], error: null }),
      postIds.length ? supabase.from("feed_comments").select("*").in("post_id", postIds).order("created_at", { ascending: true }) : Promise.resolve({ data: [], error: null }),
      fetchProfiles(profileIds),
    ]);

    if (snapshotResult.error) {
      throw snapshotResult.error;
    }

    if (commentResult.error) {
      throw commentResult.error;
    }

    return {
      snapshots: ((snapshotResult.data ?? []) as Record<string, unknown>[]).map(mapSnapshot),
      posts,
      comments: ((commentResult.data ?? []) as Record<string, unknown>[]).map(mapComment),
      profiles,
    };
  },

  async fetchPost(postId: string): Promise<FeedRemotePayload> {
    if (!isSupabaseConfigured) {
      return { snapshots: [], posts: [], comments: [], profiles: [] };
    }

    const { data: postData, error: postError } = await supabase
      .from("feed_posts")
      .select("*")
      .eq("id", postId)
      .limit(1);

    if (postError) {
      throw postError;
    }

    const posts = ((postData ?? []) as Record<string, unknown>[]).map(mapPost);
    if (!posts.length) {
      return { snapshots: [], posts: [], comments: [], profiles: [] };
    }

    const post = posts[0];
    const [snapshotResult, commentResult, profiles] = await Promise.all([
      supabase.from("feed_snapshots").select("*").eq("id", post.snapshotId).limit(1),
      supabase.from("feed_comments").select("*").eq("post_id", post.id).order("created_at", { ascending: true }),
      fetchProfiles(post.authorUserId ? [post.authorUserId] : []),
    ]);

    if (snapshotResult.error) {
      throw snapshotResult.error;
    }

    if (commentResult.error) {
      throw commentResult.error;
    }

    return {
      snapshots: ((snapshotResult.data ?? []) as Record<string, unknown>[]).map(mapSnapshot),
      posts,
      comments: ((commentResult.data ?? []) as Record<string, unknown>[]).map(mapComment),
      profiles,
    };
  },

  async fetchProfile(profileId: string) {
    if (!isSupabaseConfigured) {
      return { profile: null, posts: [], snapshots: [] as ProjectSnapshot[] };
    }

    const [profileResult, postResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).maybeSingle(),
      supabase.from("feed_posts").select("*").eq("author_user_id", profileId).order("created_at", { ascending: false }).limit(40),
    ]);

    if (profileResult.error) {
      throw profileResult.error;
    }

    if (postResult.error) {
      throw postResult.error;
    }

    const posts = ((postResult.data ?? []) as Record<string, unknown>[]).map(mapPost);
    const snapshotIds = [...new Set(posts.map((post) => post.snapshotId))];
    const snapshotResult = snapshotIds.length
      ? await supabase.from("feed_snapshots").select("*").in("id", snapshotIds)
      : { data: [], error: null };

    if (snapshotResult.error) {
      throw snapshotResult.error;
    }

    return {
      profile: profileResult.data ? mapProfile(profileResult.data as Record<string, unknown>) : null,
      posts,
      snapshots: ((snapshotResult.data ?? []) as Record<string, unknown>[]).map(mapSnapshot),
    };
  },

  async searchProfiles(query: string) {
    if (!isSupabaseConfigured) {
      return [];
    }

    const normalized = query.trim();
    if (!normalized) {
      return [];
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${normalized}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapProfile);
  },

  async publishSnapshot(snapshot: ProjectSnapshot, post: FeedPost) {
    if (!isSupabaseConfigured) {
      return;
    }

    try {
      const photoUrl = await uploadSnapshotPhoto(snapshot, post.authorUserId);

      const { error: snapshotError } = await supabase.from("feed_snapshots").upsert({
        id: snapshot.id,
        project_id: snapshot.projectId,
        owner_user_id: post.authorUserId ?? null,
        title: snapshot.title,
        row: snapshot.row,
        note: snapshot.note,
        yarn_info: snapshot.yarnInfo,
        needle_info: snapshot.needleInfo,
        method_summary: snapshot.methodSummary,
        photo_url: photoUrl ?? null,
        share_mode: post.channel === "community" && post.type === "question" ? "question" : "feed",
        hashtags: snapshot.hashtags,
        created_at: snapshot.createdAt,
      });

      if (snapshotError) {
        throw snapshotError;
      }

      const { error: postError } = await supabase.from("feed_posts").upsert({
        id: post.id,
        project_id: post.projectId,
        snapshot_id: post.snapshotId,
        channel: post.channel,
        author_user_id: post.authorUserId ?? null,
        author_name: post.authorName,
        type: post.type,
        title: post.title,
        caption: post.caption,
        like_count: post.likeCount,
        hashtags: post.hashtags,
        created_at: post.createdAt,
      });

      if (postError) {
        throw postError;
      }
    } catch (error) {
      await supabase.from("feed_posts").delete().eq("id", post.id);
      await supabase.from("feed_snapshots").delete().eq("id", snapshot.id);
      throw error;
    }
  },

  async fetchFollowMeta(profileId: string, viewerId?: string) {
    if (!isSupabaseConfigured) {
      return {
        followerCount: 0,
        followingCount: 0,
        isFollowing: false,
      };
    }

    const [followerResult, followingResult, followStateResult] = await Promise.all([
      supabase.from("profile_follows").select("*", { count: "exact", head: true }).eq("following_id", profileId),
      supabase.from("profile_follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
      viewerId && viewerId !== profileId
        ? supabase
            .from("profile_follows")
            .select("id")
            .eq("follower_id", viewerId)
            .eq("following_id", profileId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (followerResult.error) {
      throw followerResult.error;
    }

    if (followingResult.error) {
      throw followingResult.error;
    }

    if (followStateResult.error) {
      throw followStateResult.error;
    }

    return {
      followerCount: followerResult.count ?? 0,
      followingCount: followingResult.count ?? 0,
      isFollowing: Boolean(followStateResult.data),
    };
  },

  async publishComment(comment: FeedComment) {
    if (!isSupabaseConfigured) {
      return;
    }

    const { error } = await supabase.from("feed_comments").insert({
      id: comment.id,
      post_id: comment.postId,
      parent_comment_id: comment.parentCommentId ?? null,
      author_user_id: comment.authorUserId ?? null,
      author_name: comment.authorName,
      body: comment.body,
      created_at: comment.createdAt,
    });

    if (error) {
      throw error;
    }
  },

  async toggleLike(postId: string, userId: string, shouldLike: boolean) {
    if (!isSupabaseConfigured) {
      return;
    }

    if (shouldLike) {
      const { data: existingLike, error: existingError } = await supabase
        .from("feed_post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingLike) {
        return;
      }

      const { error } = await supabase.from("feed_post_likes").insert({
        post_id: postId,
        user_id: userId,
      });

      if (error) {
        const code = (error as { code?: string }).code;
        if (code === "23505") {
          return;
        }
        throw error;
      }
      return;
    }

    const { error } = await supabase.from("feed_post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) {
      throw error;
    }
  },

  async toggleFollow(followerId: string, followingId: string, shouldFollow: boolean) {
    if (!isSupabaseConfigured || followerId === followingId) {
      return;
    }

    if (shouldFollow) {
      const { data: existingFollow, error: existingError } = await supabase
        .from("profile_follows")
        .select("id")
        .eq("follower_id", followerId)
        .eq("following_id", followingId)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingFollow) {
        return;
      }

      const { error } = await supabase.from("profile_follows").insert({
        follower_id: followerId,
        following_id: followingId,
      });

      if (error) {
        const code = (error as { code?: string }).code;
        if (code === "23505") {
          return;
        }
        throw error;
      }

      return;
    }

    const { error } = await supabase
      .from("profile_follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) {
      throw error;
    }
  },
};
