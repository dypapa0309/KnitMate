import { Stack, router, useLocalSearchParams } from "expo-router";

import { ProjectForm } from "@/components/ProjectForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProjectDraft } from "@/types/project";
import { useProjectStore } from "@/stores/useProjectStore";

export default function EditProjectScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const projectId = String(params.id ?? "");
  const project = useProjectStore((state) => state.getProjectById(projectId));
  const updateProject = useProjectStore((state) => state.updateProject);

  if (!project) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: "프로젝트 수정" }} />
        <EmptyState title="프로젝트를 찾지 못했어요" description="목록에서 다시 선택해 주세요." />
      </Screen>
    );
  }

  const currentProject = project;

  const initialValue: ProjectDraft = {
    title: currentProject.title,
    notes: currentProject.notes,
    yarnInfo: currentProject.yarnInfo,
    needleInfo: currentProject.needleInfo,
    repeatLength: currentProject.repeatLength ? String(currentProject.repeatLength) : "",
    initialRow: String(currentProject.currentRow),
    accentColor: currentProject.accentColor || "",
    tag: currentProject.tag || "",
  };

  async function handleSubmit(draft: ProjectDraft) {
    await updateProject(currentProject.id, draft);
    router.replace(`/projects/${currentProject.id}`);
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: "프로젝트 수정" }} />
      <SectionHeader showBack title="프로젝트 수정" subtitle="기본 정보와 시작 단수를 다시 정리할 수 있어요." />
      <ProjectForm initialValue={initialValue} onSubmit={handleSubmit} submitLabel="변경 저장" />
    </Screen>
  );
}
