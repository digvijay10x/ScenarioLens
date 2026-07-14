import json
from groq import Groq
from app.config import get_settings
from app.models.schemas import SimulationInput


PARSER_SYSTEM_PROMPT = """You are a financial scenario parameter extractor. 
Your ONLY job is to convert a plain language scenario description into structured JSON parameters.
You do NOT do any math, projections, or recommendations.

Return ONLY valid JSON matching this exact structure (include only fields the user mentioned, use defaults for the rest):

{
    "starting_cash": 2000000,
    "projection_months": 12,
    "revenue": {
        "starting_revenue": 100000,
        "growth_rate_pct": 5.0,
        "growth_rate_change_per_period": 0.0
    },
    "hiring": {
        "new_hires_per_month": [2, 2, 3, 3],
        "avg_monthly_salary": 8000,
        "onboarding_ramp_months": 2,
        "existing_headcount": 10
    },
    "infra": {
        "base_monthly_cost": 15000,
        "cost_type": "fixed",
        "scaling_factor": 300
    }
}

Rules:
- new_hires_per_month must be an array with length equal to projection_months
- If user says "hire 50 engineers over 12 months", spread them evenly: [4, 4, 4, 4, 5, 4, 4, 4, 5, 4, 4, 4]
- If user says "hire aggressively in Q1", front-load the array
- cost_type must be either "fixed" or "scaling"
- Return ONLY the JSON object, no explanation, no markdown, no backticks"""


def parse_scenario(description: str) -> SimulationInput:
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": PARSER_SYSTEM_PROMPT},
            {"role": "user", "content": description},
        ],
        temperature=0.1,
        max_tokens=1000,
    )

    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    parsed = json.loads(raw)

    return SimulationInput(**parsed)