import json
from groq import Groq
from app.config import get_settings
from app.models.schemas import SimulationOutput


COMPARISON_SYSTEM_PROMPT = """You are a CFO-level financial analyst. You receive two simulation results (Scenario A and Scenario B) and their monthly deltas.

Your job is to write a concise comparison summary (4-6 sentences) that highlights:
- Which scenario is financially stronger and why
- The biggest difference between the two scenarios
- How runway differs and what that means
- One key tradeoff between the two approaches

Rules:
- Be specific with numbers from the data, do not be vague
- Write in plain business English, no jargon
- Do not use em dashes or en dashes
- Do not invent data that is not in the input
- Do not give recommendations, only observations
- Keep it under 200 words"""


def generate_comparison_narrative(
    name_a: str,
    name_b: str,
    output_a: SimulationOutput,
    output_b: SimulationOutput,
    runway_diff: float | None,
) -> str:
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)

    last_a = output_a.monthly_projections[-1]
    last_b = output_b.monthly_projections[-1]

    summary_data = {
        "scenario_a": {
            "name": name_a,
            "ending_revenue": last_a.revenue,
            "ending_headcount": last_a.headcount,
            "ending_cash": last_a.cash_balance,
            "ending_monthly_burn": last_a.net_burn,
            "total_revenue": output_a.total_revenue,
            "total_cost": output_a.total_cost,
            "runway_months": output_a.runway_months,
        },
        "scenario_b": {
            "name": name_b,
            "ending_revenue": last_b.revenue,
            "ending_headcount": last_b.headcount,
            "ending_cash": last_b.cash_balance,
            "ending_monthly_burn": last_b.net_burn,
            "total_revenue": output_b.total_revenue,
            "total_cost": output_b.total_cost,
            "runway_months": output_b.runway_months,
        },
        "runway_difference_months": runway_diff,
    }

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": COMPARISON_SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(summary_data)},
        ],
        temperature=0.3,
        max_tokens=500,
    )

    return response.choices[0].message.content.strip()