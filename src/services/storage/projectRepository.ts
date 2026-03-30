import AsyncStorage from "@react-native-async-storage/async-storage";

import { PersistedData, Project, ProjectLog } from "@/types/project";

const STORAGE_KEY = "knitmate/projects/v1";
const STORAGE_VERSION = 1;

const emptyData: PersistedData = {
  version: STORAGE_VERSION,
  projects: [],
  logs: [],
};

export interface ProjectRepository {
  load(): Promise<PersistedData>;
  save(projects: Project[], logs: ProjectLog[]): Promise<void>;
}

class LocalProjectRepository implements ProjectRepository {
  async load() {
    try {
      // 앱이 재시작돼도 프로젝트와 히스토리를 그대로 복원하기 위한 진입점입니다.
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return emptyData;
      }

      const parsed = JSON.parse(raw) as Partial<PersistedData>;
      return {
        version: parsed.version ?? STORAGE_VERSION,
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      };
    } catch {
      return emptyData;
    }
  }

  async save(projects: Project[], logs: ProjectLog[]) {
    // 저장 포맷을 한 곳에 모아 두면 이후 SQLite/Supabase 전환 시 영향 범위가 줄어듭니다.
    const payload: PersistedData = {
      version: STORAGE_VERSION,
      projects,
      logs,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }
}

export const projectRepository = new LocalProjectRepository();
