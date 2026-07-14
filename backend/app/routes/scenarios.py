from fastapi import APIRouter, HTTPException
from app.database.connection import get_supabase
from app.models.schemas import SimulationInput, SimulationOutput
from app.services.simulation_engine import run_simulation
from app.services.scenario_parser import parse_scenario
from app.services.narrative_generator import generate_narrative
from app.services.refinement_parser import parse_refinement
from app.services.comparison_narrator import generate_comparison_narrative
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


class CreateScenarioRequest(BaseModel):
    name: str
    input_parameters: Optional[SimulationInput] = None
    description: Optional[str] = None
    parent_scenario_id: Optional[str] = None


class CompareRequest(BaseModel):
    compare_with: str


class RefineRequest(BaseModel):
    instruction: str


@router.post("")
def create_scenario(request: CreateScenarioRequest):
    if not request.input_parameters and not request.description:
        raise HTTPException(
            status_code=400,
            detail="Provide either input_parameters or a plain language description",
        )

    if request.description and not request.input_parameters:
        request.input_parameters = parse_scenario(request.description)

    db = get_supabase()

    data = {
        "name": request.name,
        "input_parameters": request.input_parameters.model_dump(),
    }
    if request.parent_scenario_id:
        data["parent_scenario_id"] = request.parent_scenario_id

    result = db.table("scenarios").insert(data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create scenario")

    return result.data[0]


@router.get("")
def list_scenarios():
    db = get_supabase()
    result = db.table("scenarios").select("*").order("created_at", desc=True).execute()
    return result.data


@router.get("/{scenario_id}")
def get_scenario(scenario_id: str):
    db = get_supabase()

    scenario = db.table("scenarios").select("*").eq("id", scenario_id).execute()
    if not scenario.data:
        raise HTTPException(status_code=404, detail="Scenario not found")

    sim_results = (
        db.table("simulation_results")
        .select("*")
        .eq("scenario_id", scenario_id)
        .order("computed_at", desc=True)
        .limit(1)
        .execute()
    )

    return {
        "scenario": scenario.data[0],
        "simulation": sim_results.data[0] if sim_results.data else None,
    }


@router.post("/{scenario_id}/simulate")
def simulate_scenario(scenario_id: str):
    db = get_supabase()

    scenario = db.table("scenarios").select("*").eq("id", scenario_id).execute()
    if not scenario.data:
        raise HTTPException(status_code=404, detail="Scenario not found")

    input_params = SimulationInput(**scenario.data[0]["input_parameters"])
    output = run_simulation(input_params)

    narrative = generate_narrative(output, scenario.data[0]["name"])

    sim_data = {
        "scenario_id": scenario_id,
        "monthly_projection": [m.model_dump() for m in output.monthly_projections],
        "runway_months": output.runway_months,
        "cash_out_date": output.cash_out_date,
        "narrative": narrative,
    }

    result = db.table("simulation_results").insert(sim_data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save simulation")

    return {
        "simulation_id": result.data[0]["id"],
        "output": output.model_dump(),
        "narrative": narrative,
    }


@router.post("/{scenario_id}/compare")
def compare_scenarios(scenario_id: str, request: CompareRequest):
    db = get_supabase()

    scenario_a = db.table("scenarios").select("*").eq("id", scenario_id).execute()
    scenario_b = db.table("scenarios").select("*").eq("id", request.compare_with).execute()

    if not scenario_a.data:
        raise HTTPException(status_code=404, detail="Scenario A not found")
    if not scenario_b.data:
        raise HTTPException(status_code=404, detail="Scenario B not found")

    output_a = run_simulation(SimulationInput(**scenario_a.data[0]["input_parameters"]))
    output_b = run_simulation(SimulationInput(**scenario_b.data[0]["input_parameters"]))

    deltas = []
    max_months = max(len(output_a.monthly_projections), len(output_b.monthly_projections))

    for i in range(max_months):
        a = output_a.monthly_projections[i] if i < len(output_a.monthly_projections) else None
        b = output_b.monthly_projections[i] if i < len(output_b.monthly_projections) else None

        deltas.append({
            "month": i + 1,
            "revenue_delta": round((b.revenue if b else 0) - (a.revenue if a else 0), 2),
            "cost_delta": round((b.total_cost if b else 0) - (a.total_cost if a else 0), 2),
            "burn_delta": round((b.net_burn if b else 0) - (a.net_burn if a else 0), 2),
            "cash_delta": round((b.cash_balance if b else 0) - (a.cash_balance if a else 0), 2),
        })

    runway_diff = None
    if output_a.runway_months and output_b.runway_months:
        runway_diff = round(output_b.runway_months - output_a.runway_months, 1)

    comparison_narrative = generate_comparison_narrative(
        scenario_a.data[0]["name"],
        scenario_b.data[0]["name"],
        output_a,
        output_b,
        runway_diff,
    )

    return {
        "scenario_a": {"name": scenario_a.data[0]["name"], "output": output_a.model_dump()},
        "scenario_b": {"name": scenario_b.data[0]["name"], "output": output_b.model_dump()},
        "deltas": deltas,
        "runway_difference_months": runway_diff,
        "comparison_narrative": comparison_narrative,
    }


@router.post("/{scenario_id}/refine")
def refine_scenario(scenario_id: str, request: RefineRequest):
    db = get_supabase()

    scenario = db.table("scenarios").select("*").eq("id", scenario_id).execute()
    if not scenario.data:
        raise HTTPException(status_code=404, detail="Scenario not found")

    current_params = scenario.data[0]["input_parameters"]
    updated_params = parse_refinement(current_params, request.instruction)

    new_scenario = {
        "name": f"{scenario.data[0]['name']} (refined)",
        "input_parameters": updated_params.model_dump(),
        "parent_scenario_id": scenario_id,
    }

    result = db.table("scenarios").insert(new_scenario).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create refined scenario")

    return result.data[0]