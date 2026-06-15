// context.jsx — holds the live analysis result and a derived role lookup so deep
// components (RoleAvatar, etc.) can resolve role ids without prop-drilling.
import { createContext, useContext, useMemo } from "react";

const AnalysisContext = createContext({ analysis: null, roleById: {} });

export function AnalysisProvider({ analysis, children }) {
  const roleById = useMemo(
    () => Object.fromEntries((analysis?.roles || []).map((r) => [r.id, r])),
    [analysis],
  );
  return (
    <AnalysisContext.Provider value={{ analysis, roleById }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  return useContext(AnalysisContext);
}
