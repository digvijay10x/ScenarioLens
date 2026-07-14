from pydantic import BaseModel
from typing import Optional


class RevenueConfig(BaseModel):
    starting_revenue: float = 100000.0
    growth_rate_pct: float = 5.0
    growth_rate_change_per_period: float = 0.0


class HiringConfig(BaseModel):
    new_hires_per_month: list[int] = []
    avg_monthly_salary: float = 10000.0
    onboarding_ramp_months: int = 2
    existing_headcount: int = 10


class InfraCostConfig(BaseModel):
    base_monthly_cost: float = 20000.0
    cost_type: str = "fixed"
    scaling_factor: float = 500.0


class SimulationInput(BaseModel):
    starting_cash: float = 2000000.0
    projection_months: int = 12
    revenue: RevenueConfig = RevenueConfig()
    hiring: HiringConfig = HiringConfig()
    infra: InfraCostConfig = InfraCostConfig()


class MonthlySnapshot(BaseModel):
    month: int
    revenue: float
    headcount: int
    productive_headcount: float
    headcount_cost: float
    infra_cost: float
    total_cost: float
    net_burn: float
    cash_balance: float


class SimulationOutput(BaseModel):
    monthly_projections: list[MonthlySnapshot]
    runway_months: Optional[float] = None
    cash_out_date: Optional[str] = None
    total_revenue: float
    total_cost: float