"use client";

interface Scenario {
  id: string;
  name: string;
  created_at: string;
  parent_scenario_id: string | null;
}

interface Props {
  scenarios: Scenario[];
  selectedId: string | null;
  compareId: string | null;
  onSelect: (id: string) => void;
  onCompareSelect: (id: string) => void;
  onSimulate: (id: string) => void;
  onRefine: (id: string) => void;
}

export default function ScenarioList({
  scenarios,
  selectedId,
  compareId,
  onSelect,
  onCompareSelect,
  onSimulate,
  onRefine,
}: Props) {
  if (scenarios.length === 0) {
    return (
      <div className="border border-neutral-800 rounded-lg p-6 text-neutral-500 text-sm">
        No scenarios yet. Create one above.
      </div>
    );
  }

  return (
    <div className="border border-neutral-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Scenarios</h2>
      <div className="space-y-3">
        {scenarios.map((s) => (
          <div
            key={s.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedId === s.id
                ? "border-white bg-neutral-900"
                : compareId === s.id
                  ? "border-neutral-500 bg-neutral-950"
                  : "border-neutral-800 hover:border-neutral-600"
            }`}
            onClick={() => onSelect(s.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm">{s.name}</h3>
              {s.parent_scenario_id && (
                <span className="text-xs text-neutral-500 border border-neutral-700 rounded px-2 py-0.5">
                  refined
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mb-3">
              {new Date(s.created_at).toLocaleString()}
            </p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSimulate(s.id);
                }}
                className="text-xs bg-white text-black px-3 py-1 rounded hover:bg-neutral-200"
              >
                Simulate
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCompareSelect(s.id);
                }}
                className={`text-xs px-3 py-1 rounded border ${
                  compareId === s.id
                    ? "border-white text-white"
                    : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                }`}
              >
                {compareId === s.id ? "Selected for Compare" : "Compare"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRefine(s.id);
                }}
                className="text-xs px-3 py-1 rounded border border-neutral-700 text-neutral-400 hover:border-neutral-500"
              >
                Refine
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
