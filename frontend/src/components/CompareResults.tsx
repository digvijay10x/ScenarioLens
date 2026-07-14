"use client";

interface Props {
  data: {
    scenario_a: { name: string; output: any };
    scenario_b: { name: string; output: any };
    deltas: {
      month: number;
      revenue_delta: number;
      cost_delta: number;
      burn_delta: number;
      cash_delta: number;
    }[];
    runway_difference_months: number | null;
    comparison_narrative: string;
  };
  onClose: () => void;
}

function formatCurrency(n: number): string {
  const prefix = n >= 0 ? "+" : "";
  return (
    prefix +
    "$" +
    Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
  );
}

export default function CompareResults({ data, onClose }: Props) {
  const lastA = data.scenario_a.output.monthly_projections.slice(-1)[0];
  const lastB = data.scenario_b.output.monthly_projections.slice(-1)[0];

  return (
    <div className="border border-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Comparison</h2>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-white text-sm"
        >
          Close
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6">
        <p className="text-xs text-neutral-500 mb-2">AI Comparison Narrative</p>
        <p className="text-sm leading-relaxed">{data.comparison_narrative}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-neutral-900 rounded-lg p-4">
          <p className="text-xs text-neutral-500 mb-1">
            {data.scenario_a.name}
          </p>
          <p className="text-lg font-bold">
            {data.scenario_a.output.runway_months
              ? `${data.scenario_a.output.runway_months} mo runway`
              : "No cash-out"}
          </p>
          <p className="text-sm text-neutral-400">
            Ending cash: $
            {lastA.cash_balance.toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="bg-neutral-900 rounded-lg p-4">
          <p className="text-xs text-neutral-500 mb-1">
            {data.scenario_b.name}
          </p>
          <p className="text-lg font-bold">
            {data.scenario_b.output.runway_months
              ? `${data.scenario_b.output.runway_months} mo runway`
              : "No cash-out"}
          </p>
          <p className="text-sm text-neutral-400">
            Ending cash: $
            {lastB.cash_balance.toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>

      {data.runway_difference_months !== null && (
        <div className="bg-neutral-900 rounded-lg p-4 mb-6 text-center">
          <p className="text-xs text-neutral-500 mb-1">Runway Difference</p>
          <p
            className={`text-2xl font-bold ${data.runway_difference_months > 0 ? "text-green-400" : "text-red-400"}`}
          >
            {data.runway_difference_months > 0 ? "+" : ""}
            {data.runway_difference_months} months
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {data.scenario_b.name} vs {data.scenario_a.name}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-neutral-500 text-xs border-b border-neutral-800">
              <th className="text-left py-2 pr-4">Month</th>
              <th className="text-right py-2 px-2">Revenue Delta</th>
              <th className="text-right py-2 px-2">Cost Delta</th>
              <th className="text-right py-2 px-2">Burn Delta</th>
              <th className="text-right py-2 pl-2">Cash Delta</th>
            </tr>
          </thead>
          <tbody>
            {data.deltas.map((d) => (
              <tr
                key={d.month}
                className="border-b border-neutral-900 hover:bg-neutral-950"
              >
                <td className="py-2 pr-4">{d.month}</td>
                <td
                  className={`text-right py-2 px-2 ${d.revenue_delta >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {formatCurrency(d.revenue_delta)}
                </td>
                <td
                  className={`text-right py-2 px-2 ${d.cost_delta <= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {formatCurrency(d.cost_delta)}
                </td>
                <td
                  className={`text-right py-2 px-2 ${d.burn_delta <= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {formatCurrency(d.burn_delta)}
                </td>
                <td
                  className={`text-right py-2 pl-2 ${d.cash_delta >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {formatCurrency(d.cash_delta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
