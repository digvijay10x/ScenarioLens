"use client";

interface MonthlySnapshot {
  month: number;
  revenue: number;
  headcount: number;
  productive_headcount: number;
  headcount_cost: number;
  infra_cost: number;
  total_cost: number;
  net_burn: number;
  cash_balance: number;
}

interface Props {
  output: {
    monthly_projections: MonthlySnapshot[];
    runway_months: number | null;
    cash_out_date: string | null;
    total_revenue: number;
    total_cost: number;
  };
  narrative: string | null;
}

function formatCurrency(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function SimulationResults({ output, narrative }: Props) {
  const first = output.monthly_projections[0];
  const last =
    output.monthly_projections[output.monthly_projections.length - 1];

  return (
    <div className="border border-neutral-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Simulation Results</h2>

      {narrative && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6">
          <p className="text-xs text-neutral-500 mb-2">AI Narrative</p>
          <p className="text-sm leading-relaxed">{narrative}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-neutral-900 rounded-lg p-4">
          <p className="text-xs text-neutral-500 mb-1">Runway</p>
          <p className="text-2xl font-bold">
            {output.runway_months
              ? `${output.runway_months} mo`
              : "No cash-out"}
          </p>
        </div>
        <div className="bg-neutral-900 rounded-lg p-4">
          <p className="text-xs text-neutral-500 mb-1">Ending Cash</p>
          <p className="text-2xl font-bold">
            {formatCurrency(last.cash_balance)}
          </p>
        </div>
        <div className="bg-neutral-900 rounded-lg p-4">
          <p className="text-xs text-neutral-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold">
            {formatCurrency(output.total_revenue)}
          </p>
        </div>
        <div className="bg-neutral-900 rounded-lg p-4">
          <p className="text-xs text-neutral-500 mb-1">Total Cost</p>
          <p className="text-2xl font-bold">
            {formatCurrency(output.total_cost)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-neutral-500 text-xs border-b border-neutral-800">
              <th className="text-left py-2 pr-4">Month</th>
              <th className="text-right py-2 px-2">Revenue</th>
              <th className="text-right py-2 px-2">HC</th>
              <th className="text-right py-2 px-2">HC Cost</th>
              <th className="text-right py-2 px-2">Infra</th>
              <th className="text-right py-2 px-2">Net Burn</th>
              <th className="text-right py-2 pl-2">Cash</th>
            </tr>
          </thead>
          <tbody>
            {output.monthly_projections.map((m) => (
              <tr
                key={m.month}
                className="border-b border-neutral-900 hover:bg-neutral-950"
              >
                <td className="py-2 pr-4">{m.month}</td>
                <td className="text-right py-2 px-2">
                  {formatCurrency(m.revenue)}
                </td>
                <td className="text-right py-2 px-2">{m.headcount}</td>
                <td className="text-right py-2 px-2">
                  {formatCurrency(m.headcount_cost)}
                </td>
                <td className="text-right py-2 px-2">
                  {formatCurrency(m.infra_cost)}
                </td>
                <td
                  className={`text-right py-2 px-2 ${m.net_burn > 0 ? "text-red-400" : "text-green-400"}`}
                >
                  {formatCurrency(m.net_burn)}
                </td>
                <td
                  className={`text-right py-2 pl-2 ${m.cash_balance < 0 ? "text-red-400" : ""}`}
                >
                  {formatCurrency(m.cash_balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
