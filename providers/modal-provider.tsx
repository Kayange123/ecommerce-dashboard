"use client";

import { useIsMounted } from "@/hooks/useIsMounted";
import { StoreModal } from "@/components/modals/storeModal";

export const ModalProvider = () => {
  const isMounted = useIsMounted();

  if (!isMounted) return null;

  return (
    <>
      <StoreModal />
    </>
  );
};
