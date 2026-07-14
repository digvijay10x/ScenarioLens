"use client";

import { useState } from "react";
import { createScenario } from "@/lib/api";

interface Props {
  onCreated: () => void;
}

export default function CreateScenario({ onCreated }: Props) {
  const [mode, setMode] = useState<"natural" | "manual">("natural");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Manual mode fields
  const [startingCash, setStartingCash] = useState("2000000");
  const [projectionMonths, setProjectionMonths] = useState("12");
  const [startingRevenue, setStartingRevenue] = useState("100000");
  const [growthRate, setGrowthRate] = useState("5");
  const [existingHeadcount, setExistingHeadcount] = useState("10");
  const [hiresPerMonth, setHiresPerMonth] = useState("4");
  const [avgSalary, setAvgSalary] = useState("8000");
  const [rampMonths, setRampMonths] = useState("2");
  const [infraCost, setInfraCost] = useState("15000");
  const [infraType, setInfraType] = useState("fixed");
  const [scalingFactor, setScalingFactor] = useState("300");

  const handleSubmit = async () => {
    if (!name) return;
    setLoading(true);

    try {
      if (mode === "natural") {
        await createScenario({ name, description });
      } else {
        const months = parseInt(projectionMonths);
        const hires = parseInt(hiresPerMonth);
        await createScenario({
          name,
          input_parameters: {
            starting_cash: parseFloat(startingCash),
            projection_months: months,
            revenue: {
              starting_revenue: parseFloat(startingRevenue),
              growth_rate_pct: parseFloat(growthRate),
              growth_rate_change_per_period: 0,
            },
            hiring: {
              new_hires_per_month: Array(months).fill(hires),
              avg_monthly_salary: parseFloat(avgSalary),
              onboarding_ramp_months: parseInt(rampMonths),
              existing_headcount: parseInt(existingHeadcount),
            },
            infra: {
              base_monthly_cost: parseFloat(infraCost),
              cost_type: infraType,
              scaling_factor: parseFloat(scalingFactor),
            },
          },
        });
      }
      setName("");
      setDescription("");
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-neutral-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Create Scenario</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("natural")}
          className={`px-4 py-2 rounded text-sm ${
            mode === "natural"
              ? "bg-white text-black"
              : "border border-neutral-700 text-neutral-400"
          }`}
        >
          Plain Language
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded text-sm ${
            mode === "manual"
              ? "bg-white text-black"
              : "border border-neutral-700 text-neutral-400"
          }`}
        >
          Manual Input
        </button>
      </div>

      <input
        type="text"
        placeholder="Scenario name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:border-neutral-600"
      />

      {mode === "natural" ? (
        <textarea
          placeholder="e.g. What if we hire 50 engineers over 12 months with 2M starting cash and 100k monthly revenue growing at 8%"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:border-neutral-600 resize-none"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">
              Starting Cash ($)
            </label>
            <input
              type="number"
              value={startingCash}
              onChange={(e) => setStartingCash(e.target.value)}
              className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">
              Projection Months
            </label>
            <input
              type="number"
              value={projectionMonths}
              onChange={(e) => setProjectionMonths(e.target.value)}
              className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">
              Starting Revenue ($)
            </label>
            <input
              type="number"
              value={startingRevenue}
              onChange={(e) => setStartingRevenue(e.target.value)}
              className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">
              Revenue Growth (%)
            </label>
            <input
              type="number"
              value={growthRate}
              onChange={(e) => setGrowthRate(e.target.value)}
              className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">
              Existing Headcount
            </label>
            <input
              type="number"
              value={existingHeadcount}
              onChange={(e) => setExistingHeadcount(e.target.value)}
              className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">
              Hires per Month
            </label>
            <input
              type="number"
              value={hiresPerMonth}
              onChange={(e) => setHiresPerMonth(e.target.value)}
              className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">
              Avg Monthly Salary ($)
            </label>
            <input
              type="number"
              value={avgSalary}
              onChange={(e) => setAvgSalary(e.target.value)}
              className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">
              Onboarding Ramp (months)
            </label>
            <input
              type="number"
              value={rampMonths}
              onChange={(e) => setRampMonths(e.target.value)}
              className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">
              Infra Base Cost ($)
            </label>
            <input
              type="number"
              value={infraCost}
              onChange={(e) => setInfraCost(e.target.value)}
              className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">
              Infra Cost Type
            </label>
            <select
              value={infraType}
              onChange={(e) => setInfraType(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            >
              <option value="fixed">Fixed</option>
              <option value="scaling">Scaling</option>
            </select>
          </div>
          {infraType === "scaling" && (
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">
                Scaling Factor ($)
              </label>
              <input
                type="number"
                value={scalingFactor}
                onChange={(e) => setScalingFactor(e.target.value)}
                className="w-full bg-transparent border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
              />
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !name}
        className="w-full bg-white text-black py-2 rounded text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creating..." : "Create Scenario"}
      </button>
    </div>
  );
}
