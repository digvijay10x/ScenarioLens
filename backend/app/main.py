from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.scenarios import router as scenarios_router

app = FastAPI(
    title="ScenarioLens",
    description="What-If Financial Scenario Modeling Engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scenarios_router)


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ScenarioLens"}