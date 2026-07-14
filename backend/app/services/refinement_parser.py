import json
from groq import Groq
from app.config import get_settings
from app.models.schemas import SimulationInput


REFINEMENT_SYSTEM_PROMPT = """You are a financial scenario parameter modifier. You receive:
1. The current scenario parameters as JSON
2. A user instruction describing a change to apply

Your ONLY job is to return the FULL updated parameter set with the requested change applied.

Rules:
- Return the complete JSON structure, not just the changed fields
- If user says "cut hiring by 30%", reduce each value in new_hires_per_month by 30% and round to nearest integer
- If user says "increase revenue growth to 10%", change growth_rate_pct to 10
- If user says "delay hiring by 3 months", shift new_hires_per_month array by inserting 3 zeros at the start and trimming the end to keep same length
- If user says "double infra costs", multiply base_monthly_cost by 2
- If user says "extend to 18 months", change projection_months and extend new_hires_per_month array accordingly
- Do not change fields the user did not mention
- Return ONLY valid JSON, no explanation, no markdown, no backticks"""


def parse_refinement(current_params: dict, instruction: str) -> SimulationInput:
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)

    prompt = f"""Current scenario parameters:
{json.dumps(current_params, indent=2)}

User instruction: {instruction}

Return the full updated parameter set as JSON."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": REFINEMENT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=1000,
    )

    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    parsed = json.loads(raw)

    return SimulationInput(**parsed)