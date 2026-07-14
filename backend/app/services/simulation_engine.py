from app.models.schemas import (
    SimulationInput,
    MonthlySnapshot,
    SimulationOutput,
)


def run_simulation(inputs: SimulationInput) -> SimulationOutput:
    projections: list[MonthlySnapshot] = []
    cash_balance = inputs.starting_cash
    revenue = inputs.revenue.starting_revenue
    growth_rate = inputs.revenue.growth_rate_pct / 100.0
    current_headcount = inputs.hiring.existing_headcount
    total_revenue = 0.0
    total_cost = 0.0

    hire_ledger: list[int] = []

    for month in range(1, inputs.projection_months + 1):

        # --- Revenue (compound growth) ---
        if month > 1:
            revenue = revenue * (1 + growth_rate)
            growth_rate += inputs.revenue.growth_rate_change_per_period / 100.0

        # --- Headcount ---
        new_hires_this_month = 0
        if month - 1 < len(inputs.hiring.new_hires_per_month):
            new_hires_this_month = inputs.hiring.new_hires_per_month[month - 1]
        current_headcount += new_hires_this_month
        hire_ledger.append(new_hires_this_month)

        # --- Productive headcount (onboarding ramp) ---
        productive = inputs.hiring.existing_headcount
        ramp = inputs.hiring.onboarding_ramp_months

        for i, hires in enumerate(hire_ledger):
            if hires == 0:
                continue
            hire_month = i + 1
            months_since_hire = month - hire_month
            if months_since_hire >= ramp:
                productive += hires
            else:
                fraction = months_since_hire / ramp if ramp > 0 else 1.0
                productive += hires * fraction

        # --- Headcount cost (full cost for all, not just productive) ---
        headcount_cost = current_headcount * inputs.hiring.avg_monthly_salary

        # --- Infra cost ---
        if inputs.infra.cost_type == "fixed":
            infra_cost = inputs.infra.base_monthly_cost
        else:
            infra_cost = (
                inputs.infra.base_monthly_cost
                + inputs.infra.scaling_factor * current_headcount
            )

        # --- Totals ---
        monthly_total_cost = headcount_cost + infra_cost
        net_burn = monthly_total_cost - revenue
        cash_balance -= net_burn

        total_revenue += revenue
        total_cost += monthly_total_cost

        projections.append(
            MonthlySnapshot(
                month=month,
                revenue=round(revenue, 2),
                headcount=current_headcount,
                productive_headcount=round(productive, 2),
                headcount_cost=round(headcount_cost, 2),
                infra_cost=round(infra_cost, 2),
                total_cost=round(monthly_total_cost, 2),
                net_burn=round(net_burn, 2),
                cash_balance=round(cash_balance, 2),
            )
        )

    # --- Runway calculation ---
    runway_months = None
    cash_out_date = None

    for snapshot in projections:
        if snapshot.cash_balance <= 0:
            prev = projections[snapshot.month - 2] if snapshot.month > 1 else None
            if prev and prev.cash_balance > 0:
                fraction = prev.cash_balance / (prev.cash_balance - snapshot.cash_balance)
                runway_months = round((snapshot.month - 1) + fraction, 1)
            else:
                runway_months = float(snapshot.month)
            cash_out_date = f"Month {runway_months}"
            break

    if runway_months is None and projections:
        last = projections[-1]
        if last.net_burn > 0:
            remaining = last.cash_balance / last.net_burn
            runway_months = round(inputs.projection_months + remaining, 1)
            cash_out_date = f"Month {runway_months}"

    return SimulationOutput(
        monthly_projections=projections,
        runway_months=runway_months,
        cash_out_date=cash_out_date,
        total_revenue=round(total_revenue, 2),
        total_cost=round(total_cost, 2),
    )