import { router, Stack } from "expo-router";

import { ProjectForm } from "@/components/ProjectForm";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProjectDraft } from "@/types/project";
import { useProjectStore } from "@/stores/useProjectStore";

const emptyDraft: ProjectDraft = {
  title: "",
  notes: "",
  yarnInfo: "",
  needleInfo: "",
  repeatLength: "",
  initialRow: "0",
  accentColor: "",
  tag: "",
};

export default function NewProjectScreen() {
  const createProject = useProjectStore((state) => state.createProject);

  async function handleSubmit(draft: ProjectDraft) {
    const id = await createProject(draft);
    router.replace(`/projects/${id}`);
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: "새 작업" }} />
      <SectionHeader
        showBack
        title="새 뜨개 시작하기"
        subtitle="지금 손에 올린 작업을 잊지 않도록, 시작점만 가볍게 남겨 둘게요."
      />
      <ProjectForm initialValue={emptyDraft} onSubmit={handleSubmit} submitLabel="이 작업 저장하기" />
    </Screen>
  );
}
