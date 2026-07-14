import pytest
from app.models.schemas import (
    SimulationInput,
    RevenueConfig,
    HiringConfig,
    InfraCostConfig,
)
from app.services.simulation_engine import run_simulation


def test_revenue_compounding():
    """Revenue must compound, not add flat."""
    inputs = SimulationInput(
        projection_months=3,
        starting_cash=5000000,
        revenue=RevenueConfig(
            starting_revenue=100000,
            growth_rate_pct=10.0,
        ),
        hiring=HiringConfig(new_hires_per_month=[], existing_headcount=0),
        infra=InfraCostConfig(base_monthly_cost=0),
    )
    result = run_simulation(inputs)
    revenues = [m.revenue for m in result.monthly_projections]

    assert revenues[0] == 100000.0
    assert revenues[1] == pytest.approx(110000.0, rel=1e-4)
    assert revenues[2] == pytest.approx(121000.0, rel=1e-4)


def test_negative_growth_rate():
    """Revenue must decline correctly with negative growth."""
    inputs = SimulationInput(
        projection_months=3,
        starting_cash=5000000,
        revenue=RevenueConfig(
            starting_revenue=100000,
            growth_rate_pct=-20.0,
        ),
        hiring=HiringConfig(new_hires_per_month=[], existing_headcount=0),
        infra=InfraCostConfig(base_monthly_cost=0),
    )
    result = run_simulation(inputs)
    revenues = [m.revenue for m in result.monthly_projections]

    assert revenues[0] == 100000.0
    assert revenues[1] == pytest.approx(80000.0, rel=1e-4)
    assert revenues[2] == pytest.approx(64000.0, rel=1e-4)


def test_mid_period_hire_not_costed_from_month_one():
    """A hire in month 3 must not appear in month 1 or 2 costs."""
    inputs = SimulationInput(
        projection_months=4,
        starting_cash=5000000,
        revenue=RevenueConfig(starting_revenue=0),
        hiring=HiringConfig(
            new_hires_per_month=[0, 0, 5, 0],
            avg_monthly_salary=10000,
            existing_headcount=0,
        ),
        infra=InfraCostConfig(base_monthly_cost=0),
    )
    result = run_simulation(inputs)
    costs = [m.headcount_cost for m in result.monthly_projections]

    assert costs[0] == 0.0
    assert costs[1] == 0.0
    assert costs[2] == 50000.0
    assert costs[3] == 50000.0


def test_onboarding_ramp():
    """New hires ramp up productivity over onboarding period."""
    inputs = SimulationInput(
        projection_months=4,
        starting_cash=5000000,
        revenue=RevenueConfig(starting_revenue=0),
        hiring=HiringConfig(
            new_hires_per_month=[10, 0, 0, 0],
            onboarding_ramp_months=2,
            existing_headcount=0,
        ),
        infra=InfraCostConfig(base_monthly_cost=0),
    )
    result = run_simulation(inputs)
    productive = [m.productive_headcount for m in result.monthly_projections]

    assert productive[0] == 0.0
    assert productive[1] == 5.0
    assert productive[2] == 10.0
    assert productive[3] == 10.0


def test_zero_starting_cash():
    """Runway should be 0 or immediate cash-out with zero cash."""
    inputs = SimulationInput(
        starting_cash=0,
        projection_months=6,
        revenue=RevenueConfig(starting_revenue=50000),
        hiring=HiringConfig(
            new_hires_per_month=[],
            avg_monthly_salary=10000,
            existing_headcount=10,
        ),
        infra=InfraCostConfig(base_monthly_cost=10000),
    )
    result = run_simulation(inputs)

    assert result.monthly_projections[0].cash_balance <= 0


def test_infra_scaling_with_headcount():
    """Infra cost must scale with headcount when type is 'scaling'."""
    inputs = SimulationInput(
        projection_months=3,
        starting_cash=5000000,
        revenue=RevenueConfig(starting_revenue=0),
        hiring=HiringConfig(
            new_hires_per_month=[5, 5, 0],
            existing_headcount=10,
        ),
        infra=InfraCostConfig(
            base_monthly_cost=1000,
            cost_type="scaling",
            scaling_factor=200,
        ),
    )
    result = run_simulation(inputs)
    infra = [m.infra_cost for m in result.monthly_projections]

    assert infra[0] == 1000 + 200 * 15
    assert infra[1] == 1000 + 200 * 20
    assert infra[2] == 1000 + 200 * 20


def test_runway_interpolation():
    """Runway must interpolate to fractional month, not just snap to integer."""
    inputs = SimulationInput(
        starting_cash=150000,
        projection_months=12,
        revenue=RevenueConfig(starting_revenue=0),
        hiring=HiringConfig(
            new_hires_per_month=[],
            avg_monthly_salary=10000,
            existing_headcount=10,
        ),
        infra=InfraCostConfig(base_monthly_cost=50000),
    )
    result = run_simulation(inputs)

    assert result.runway_months is not None
    assert result.runway_months == 1.0


def test_profitable_company_no_cashout():
    """Revenue exceeding costs means no cash-out within projection."""
    inputs = SimulationInput(
        starting_cash=1000000,
        projection_months=12,
        revenue=RevenueConfig(starting_revenue=500000),
        hiring=HiringConfig(
            new_hires_per_month=[],
            avg_monthly_salary=10000,
            existing_headcount=5,
        ),
        infra=InfraCostConfig(base_monthly_cost=10000),
    )
    result = run_simulation(inputs)

    assert result.runway_months is None
    assert result.cash_out_date is None
    assert result.monthly_projections[-1].cash_balance > inputs.starting_cash