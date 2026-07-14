"use client";

import { useState } from "react";
import { refineScenario } from "@/lib/api";

interface Props {
  scenarioId: string;
  scenarioName: string;
  onRefined: () => void;
  onClose: () => void;
}

export default function RefineModal({
  scenarioId,
  scenarioName,
  onRefined,
  onClose,
}: Props) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRefine = async () => {
    if (!instruction) return;
    setLoading(true);

    try {
      await refineScenario(scenarioId, instruction);
      onRefined();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-1">Refine Scenario</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Modifying: {scenarioName}
        </p>

        <textarea
          placeholder="e.g. Cut hiring by 30% and increase revenue growth to 12%"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={3}
          className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:border-neutral-600 resize-none"
        />

        <div className="flex gap-2">
          <button
            onClick={handleRefine}
            disabled={loading || !instruction}
            className="flex-1 bg-white text-black py-2 rounded text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Refining..." : "Refine"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-neutral-700 text-neutral-400 py-2 rounded text-sm hover:border-neutral-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
