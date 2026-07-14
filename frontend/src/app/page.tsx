"use client";

import { useState, useEffect } from "react";
import CreateScenario from "@/components/CreateScenario";
import ScenarioList from "@/components/ScenarioList";
import SimulationResults from "@/components/SimulationResults";
import CompareResults from "@/components/CompareResults";
import RefineModal from "@/components/RefineModal";
import { listScenarios, simulateScenario, compareScenarios } from "@/lib/api";

export default function Home() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<any>(null);
  const [compareResult, setCompareResult] = useState<any>(null);
  const [refineTarget, setRefineTarget] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchScenarios = async () => {
    const data = await listScenarios();
    setScenarios(data);
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleSimulate = async (id: string) => {
    setLoading(true);
    setSimResult(null);
    setCompareResult(null);
    setSelectedId(id);

    try {
      const result = await simulateScenario(id);
      setSimResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!selectedId || !compareId) return;
    setLoading(true);
    setSimResult(null);

    try {
      const result = await compareScenarios(selectedId, compareId);
      setCompareResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompareSelect = (id: string) => {
    if (compareId === id) {
      setCompareId(null);
    } else {
      setCompareId(id);
      if (selectedId && id !== selectedId) {
        setTimeout(() => handleCompareWithIds(selectedId, id), 0);
      }
    }
  };

  const handleCompareWithIds = async (idA: string, idB: string) => {
    setLoading(true);
    setSimResult(null);

    try {
      const result = await compareScenarios(idA, idB);
      setCompareResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = (id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (scenario) {
      setRefineTarget(scenario);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">ScenarioLens</h1>
        <p className="text-sm text-neutral-500">
          What-If Financial Scenario Modeling
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <CreateScenario onCreated={fetchScenarios} />
            <ScenarioList
              scenarios={scenarios}
              selectedId={selectedId}
              compareId={compareId}
              onSelect={setSelectedId}
              onCompareSelect={handleCompareSelect}
              onSimulate={handleSimulate}
              onRefine={handleRefine}
            />
          </div>

          <div className="lg:col-span-2">
            {loading && (
              <div className="border border-neutral-800 rounded-lg p-12 flex items-center justify-center">
                <p className="text-neutral-500 text-sm">Processing...</p>
              </div>
            )}

            {!loading && simResult && (
              <SimulationResults
                output={simResult.output}
                narrative={simResult.narrative}
              />
            )}

            {!loading && compareResult && (
              <CompareResults
                data={compareResult}
                onClose={() => {
                  setCompareResult(null);
                  setCompareId(null);
                }}
              />
            )}

            {!loading && !simResult && !compareResult && (
              <div className="border border-neutral-800 rounded-lg p-12 flex items-center justify-center">
                <p className="text-neutral-500 text-sm">
                  Create a scenario and click Simulate to see projections
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {refineTarget && (
        <RefineModal
          scenarioId={refineTarget.id}
          scenarioName={refineTarget.name}
          onRefined={fetchScenarios}
          onClose={() => setRefineTarget(null)}
        />
      )}
    </div>
  );
}
