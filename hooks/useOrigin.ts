"use client";
import { useIsMounted } from "@/hooks/useIsMounted";

export const useOrigin = () => {
  const isMounted = useIsMounted();
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "";

  if (!isMounted) {
    return "";
  }

  return origin;
};
