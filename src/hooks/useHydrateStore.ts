import { useEffect } from "react";

import { useProjectStore } from "@/stores/useProjectStore";

export function useHydrateStore() {
  const hydrate = useProjectStore((state) => state.hydrate);
  const isHydrated = useProjectStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [hydrate, isHydrated]);

  return isHydrated;
}
