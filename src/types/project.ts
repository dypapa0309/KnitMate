export type Project = {
  id: string;
  title: string;
  notes: string;
  yarnInfo: string;
  needleInfo: string;
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
  | "restore";

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
};

export type ProjectDraft = {
  title: string;
  notes: string;
  yarnInfo: string;
  needleInfo: string;
  initialRow: string;
  accentColor: string;
  tag: string;
};
