import { create } from "zustand";

import { projectRepository } from "@/services/storage/projectRepository";
import { createId } from "@/utils/id";
import { Project, ProjectDraft, ProjectLog, ProjectLogAction } from "@/types/project";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type ProjectState = {
  projects: Project[];
  logs: ProjectLog[];
  isHydrated: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  lastSavedAt: string | null;
  hydrate: () => Promise<void>;
  createProject: (draft: ProjectDraft) => Promise<string>;
  updateProject: (projectId: string, draft: ProjectDraft) => Promise<void>;
  incrementRow: (projectId: string) => Promise<void>;
  decrementRow: (projectId: string) => Promise<void>;
  saveQuickNote: (projectId: string, note: string) => Promise<void>;
  restoreFromLog: (projectId: string, logId: string) => Promise<void>;
  clearError: () => void;
  getProjectById: (projectId: string) => Project | undefined;
  getLogsByProjectId: (projectId: string) => ProjectLog[];
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeRow(value: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
}

function serializeProject(project: Project) {
  return JSON.stringify(project);
}

function createLog(
  projectId: string,
  actionType: ProjectLogAction,
  beforeValue: string,
  afterValue: string,
  note: string,
): ProjectLog {
  return {
    id: createId("log"),
    projectId,
    actionType,
    beforeValue,
    afterValue,
    note,
    createdAt: nowIso(),
  };
}

async function persistState(projects: Project[], logs: ProjectLog[]) {
  await projectRepository.save(projects, logs);
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  logs: [],
  isHydrated: false,
  saveStatus: "idle",
  saveError: null,
  lastSavedAt: null,

  hydrate: async () => {
    const data = await projectRepository.load();
    set({
      projects: data.projects,
      logs: data.logs,
      isHydrated: true,
      saveStatus: "saved",
      saveError: null,
      lastSavedAt: nowIso(),
    });
  },

  createProject: async (draft) => {
    const timestamp = nowIso();
    const project: Project = {
      id: createId("project"),
      title: draft.title.trim(),
      notes: draft.notes.trim(),
      yarnInfo: draft.yarnInfo.trim(),
      needleInfo: draft.needleInfo.trim(),
      currentRow: normalizeRow(draft.initialRow),
      createdAt: timestamp,
      updatedAt: timestamp,
      lastWorkedAt: timestamp,
      archived: false,
      accentColor: draft.accentColor || undefined,
      tag: draft.tag.trim() || undefined,
    };

    const log = createLog(project.id, "create", "", serializeProject(project), "프로젝트 생성");
    const nextProjects = [project, ...get().projects];
    const nextLogs = [log, ...get().logs];

    // 먼저 UI를 갱신해 사용자가 저장 지연을 느끼지 않도록 합니다.
    set({
      projects: nextProjects,
      logs: nextLogs,
      saveStatus: "saving",
      saveError: null,
    });

    try {
      await persistState(nextProjects, nextLogs);
      set({
        saveStatus: "saved",
        lastSavedAt: nowIso(),
      });
      return project.id;
    } catch {
      set({
        saveStatus: "error",
        saveError: "프로젝트를 저장하지 못했어요. 다시 시도해 주세요.",
      });
      return project.id;
    }
  },

  updateProject: async (projectId, draft) => {
    const existing = get().getProjectById(projectId);
    if (!existing) {
      return;
    }

    const updated: Project = {
      ...existing,
      title: draft.title.trim(),
      notes: draft.notes.trim(),
      yarnInfo: draft.yarnInfo.trim(),
      needleInfo: draft.needleInfo.trim(),
      currentRow: normalizeRow(draft.initialRow),
      accentColor: draft.accentColor || undefined,
      tag: draft.tag.trim() || undefined,
      updatedAt: nowIso(),
    };

    const log = createLog(
      projectId,
      "update",
      serializeProject(existing),
      serializeProject(updated),
      "프로젝트 정보 수정",
    );

    const nextProjects = get().projects.map((project) => (project.id === projectId ? updated : project));
    const nextLogs = [log, ...get().logs];

    // 수정 화면에서도 같은 방식으로 낙관적 업데이트 후 저장합니다.
    set({
      projects: nextProjects,
      logs: nextLogs,
      saveStatus: "saving",
      saveError: null,
    });

    try {
      await persistState(nextProjects, nextLogs);
      set({
        saveStatus: "saved",
        lastSavedAt: nowIso(),
      });
    } catch {
      set({
        saveStatus: "error",
        saveError: "변경 내용을 저장하지 못했어요. 다시 시도해 주세요.",
      });
    }
  },

  incrementRow: async (projectId) => {
    const existing = get().getProjectById(projectId);
    if (!existing) {
      return;
    }

    const updated: Project = {
      ...existing,
      currentRow: existing.currentRow + 1,
      updatedAt: nowIso(),
      lastWorkedAt: nowIso(),
    };

    const log = createLog(
      projectId,
      "row_increment",
      String(existing.currentRow),
      String(updated.currentRow),
      `단수 ${existing.currentRow} -> ${updated.currentRow}`,
    );

    const nextProjects = get().projects.map((project) => (project.id === projectId ? updated : project));
    const nextLogs = [log, ...get().logs];

    // 작업 화면의 핵심 UX라서 버튼 반응이 가장 먼저 느껴지도록 즉시 반영합니다.
    set({
      projects: nextProjects,
      logs: nextLogs,
      saveStatus: "saving",
      saveError: null,
    });

    try {
      await persistState(nextProjects, nextLogs);
      set({
        saveStatus: "saved",
        lastSavedAt: nowIso(),
      });
    } catch {
      set({
        saveStatus: "error",
        saveError: "단수 저장에 실패했어요.",
      });
    }
  },

  decrementRow: async (projectId) => {
    const existing = get().getProjectById(projectId);
    if (!existing) {
      return;
    }

    const updated: Project = {
      ...existing,
      currentRow: Math.max(0, existing.currentRow - 1),
      updatedAt: nowIso(),
      lastWorkedAt: nowIso(),
    };

    const log = createLog(
      projectId,
      "row_decrement",
      String(existing.currentRow),
      String(updated.currentRow),
      `단수 ${existing.currentRow} -> ${updated.currentRow}`,
    );

    const nextProjects = get().projects.map((project) => (project.id === projectId ? updated : project));
    const nextLogs = [log, ...get().logs];

    set({
      projects: nextProjects,
      logs: nextLogs,
      saveStatus: "saving",
      saveError: null,
    });

    try {
      await persistState(nextProjects, nextLogs);
      set({
        saveStatus: "saved",
        lastSavedAt: nowIso(),
      });
    } catch {
      set({
        saveStatus: "error",
        saveError: "단수 저장에 실패했어요.",
      });
    }
  },

  saveQuickNote: async (projectId, note) => {
    const existing = get().getProjectById(projectId);
    if (!existing || existing.notes === note) {
      return;
    }

    const updated: Project = {
      ...existing,
      notes: note,
      updatedAt: nowIso(),
      lastWorkedAt: nowIso(),
    };

    const log = createLog(projectId, "note_update", existing.notes, updated.notes, "빠른 메모 저장");
    const nextProjects = get().projects.map((project) => (project.id === projectId ? updated : project));
    const nextLogs = [log, ...get().logs];

    set({
      projects: nextProjects,
      logs: nextLogs,
      saveStatus: "saving",
      saveError: null,
    });

    try {
      await persistState(nextProjects, nextLogs);
      set({
        saveStatus: "saved",
        lastSavedAt: nowIso(),
      });
    } catch {
      set({
        saveStatus: "error",
        saveError: "메모를 저장하지 못했어요.",
      });
    }
  },

  restoreFromLog: async (projectId, logId) => {
    const existing = get().getProjectById(projectId);
    const log = get().logs.find((item) => item.id === logId && item.projectId === projectId);

    if (!existing || !log) {
      return;
    }

    let restoredProject: Project;

    if (log.actionType === "row_increment" || log.actionType === "row_decrement") {
      restoredProject = {
        ...existing,
        currentRow: Number(log.afterValue) || existing.currentRow,
        updatedAt: nowIso(),
        lastWorkedAt: nowIso(),
      };
    } else if (log.actionType === "note_update") {
      restoredProject = {
        ...existing,
        notes: log.afterValue,
        updatedAt: nowIso(),
        lastWorkedAt: nowIso(),
      };
    } else {
      restoredProject = {
        ...(JSON.parse(log.afterValue) as Project),
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: nowIso(),
        lastWorkedAt: nowIso(),
      };
    }

    // 복구 자체도 하나의 변경 이력으로 남겨서 다시 되돌아갈 수 있게 합니다.
    const backupLog = createLog(
      projectId,
      "restore",
      serializeProject(existing),
      serializeProject(restoredProject),
      `복구 기준: ${log.createdAt}`,
    );

    const nextProjects = get().projects.map((project) =>
      project.id === projectId ? restoredProject : project,
    );
    const nextLogs = [backupLog, ...get().logs];

    set({
      projects: nextProjects,
      logs: nextLogs,
      saveStatus: "saving",
      saveError: null,
    });

    try {
      await persistState(nextProjects, nextLogs);
      set({
        saveStatus: "saved",
        lastSavedAt: nowIso(),
      });
    } catch {
      set({
        saveStatus: "error",
        saveError: "복구 내용을 저장하지 못했어요.",
      });
    }
  },

  clearError: () => set({ saveError: null }),

  getProjectById: (projectId) => get().projects.find((project) => project.id === projectId),

  getLogsByProjectId: (projectId) =>
    get()
      .logs.filter((log) => log.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
}));
