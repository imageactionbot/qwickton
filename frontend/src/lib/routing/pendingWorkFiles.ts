import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { scrollToIdBelowStickyHeaderAfterPaint } from "../dom/scrollBelowStickyHeader";

/** React Router location state key for handing off files from Smart Drop (and similar flows). */
export const PENDING_WORK_FILES_KEY = "qwicktonPendingWorkFiles" as const;

export type PendingWorkFilesState = {
  [PENDING_WORK_FILES_KEY]?: File[];
};

const appliedNavFingerprints = new Set<string>();
const MAX_FP = 80;

function rememberFingerprint(fp: string): void {
  if (appliedNavFingerprints.size > MAX_FP) appliedNavFingerprints.clear();
  appliedNavFingerprints.add(fp);
}

/**
 * One-shot per navigation: read pending files from location state and pass them to a hub.
 * Pairs React Router `location.key` with a file fingerprint so StrictMode remounts do not double-apply.
 */
export function usePendingWorkFiles(
  onReceive: (files: File[]) => void,
  options?: { filter?: (file: File) => boolean; scrollToWorkId?: string }
): void {
  const onReceiveRef = useRef(onReceive);
  onReceiveRef.current = onReceive;
  const filterRef = useRef(options?.filter);
  filterRef.current = options?.filter;
  const scrollToWorkIdRef = useRef(options?.scrollToWorkId);
  scrollToWorkIdRef.current = options?.scrollToWorkId;
  const location = useLocation();
  const locationState = location.state as PendingWorkFilesState | null | undefined;

  useEffect(() => {
    const raw = locationState?.[PENDING_WORK_FILES_KEY];
    if (!raw?.length) return;
    const payloadKey = raw
      .map((f) => `${f.name}\0${f.size}\0${f.lastModified}\0${f.type}`)
      .join("|");
    const fp = `${location.key}|${payloadKey}`;
    if (appliedNavFingerprints.has(fp)) return;
    rememberFingerprint(fp);
    const list = filterRef.current ? raw.filter(filterRef.current) : [...raw];
    if (list.length) {
      onReceiveRef.current(list);
      const sid = scrollToWorkIdRef.current;
      if (sid) scrollToIdBelowStickyHeaderAfterPaint(sid);
    }
  }, [location.key, locationState]);
}
