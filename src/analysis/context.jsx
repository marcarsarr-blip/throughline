// context.jsx — holds the live analysis result, a derived role lookup, and a setter so
// stages (e.g. Step 2) can edit/delete roles and jobs and have it persist everywhere.
import { createContext, useContext, useMemo } from "react";

const AnalysisContext = createContext({ analysis: null, roleById: {}, setAnalysis: () => {} });

export function AnalysisProvider({ analysis, onChange, children }) {
  const roleById = useMemo(
    () => Object.fromEntries((analysis?.roles || []).map((r) => [r.id, r])),
    [analysis],
  );
  return (
    <AnalysisContext.Provider value={{ analysis, roleById, setAnalysis: onChange || (() => {}) }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  return useContext(AnalysisContext);
}
