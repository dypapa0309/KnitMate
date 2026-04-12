export type Project = {
  id: string;
  title: string;
  notes: string;
  yarnInfo: string;
  needleInfo: string;
  repeatLength?: number;
  currentRow: number;
  createdAt: string;
  updatedAt: string;
  lastWorkedAt: string;
  archived: boolean;
  accentColor?: string;
  tag?: string;
};

export type ProjectLogAction =
  | "create"
  | "update"
  | "row_increment"
  | "row_decrement"
  | "note_update"
  | "snapshot"
  | "restore";

export type ProjectSnapshot = {
  id: string;
  projectId: string;
  title: string;
  row: number;
  note: string;
  yarnInfo: string;
  needleInfo: string;
  methodSummary: string;
  photoUri?: string;
  hashtags: string[];
  createdAt: string;
};

export type FeedPostChannel = "feed" | "community";

export type FeedPostType = "share" | "question";

export type FeedPost = {
  id: string;
  projectId: string;
  snapshotId: string;
  channel: FeedPostChannel;
  authorUserId?: string;
  authorName: string;
  type: FeedPostType;
  title: string;
  caption: string;
  likeCount: number;
  hashtags: string[];
  createdAt: string;
};

export type FeedComment = {
  id: string;
  postId: string;
  parentCommentId?: string;
  authorUserId?: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type SocialProfile = {
  id: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
};

export type ProjectLog = {
  id: string;
  projectId: string;
  actionType: ProjectLogAction;
  beforeValue: string;
  afterValue: string;
  note: string;
  createdAt: string;
};

export type PersistedData = {
  version: number;
  projects: Project[];
  logs: ProjectLog[];
  snapshots: ProjectSnapshot[];
};

export type ProjectDraft = {
  title: string;
  notes: string;
  yarnInfo: string;
  needleInfo: string;
  repeatLength: string;
  initialRow: string;
  accentColor: string;
  tag: string;
};
