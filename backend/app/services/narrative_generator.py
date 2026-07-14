import json
from groq import Groq
from app.config import get_settings
from app.models.schemas import SimulationOutput


NARRATIVE_SYSTEM_PROMPT = """You are a CFO-level financial analyst. You receive structured simulation results from a financial projection engine.

Your job is to write a concise executive summary (3-5 sentences) that highlights:
- The overall financial trajectory (growing, stable, or declining)
- Key cost drivers and their impact
- Cash runway and what it means for the company
- One actionable observation

Rules:
- Be specific with numbers from the data, do not be vague
- Write in plain business English, no jargon
- Do not use em dashes or en dashes
- Do not invent data that is not in the input
- Do not give recommendations, only observations
- Keep it under 150 words"""


def generate_narrative(output: SimulationOutput, scenario_name: str) -> str:
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)

    first = output.monthly_projections[0]
    last = output.monthly_projections[-1]

    summary_data = {
        "scenario_name": scenario_name,
        "months": len(output.monthly_projections),
        "starting_revenue": first.revenue,
        "ending_revenue": last.revenue,
        "starting_headcount": first.headcount,
        "ending_headcount": last.headcount,
        "starting_cash": first.cash_balance + first.net_burn,
        "ending_cash": last.cash_balance,
        "total_revenue": output.total_revenue,
        "total_cost": output.total_cost,
        "runway_months": output.runway_months,
        "cash_out_date": output.cash_out_date,
        "ending_monthly_burn": last.net_burn,
        "ending_headcount_cost": last.headcount_cost,
        "ending_infra_cost": last.infra_cost,
    }

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": NARRATIVE_SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(summary_data)},
        ],
        temperature=0.3,
        max_tokens=500,
    )

    return response.choices[0].message.content.strip()