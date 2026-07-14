const API_URL = "http://localhost:8000";

export async function createScenario(data: {
  name: string;
  description?: string;
  input_parameters?: any;
}) {
  const res = await fetch(`${API_URL}/scenarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function listScenarios() {
  const res = await fetch(`${API_URL}/scenarios`);
  return res.json();
}

export async function getScenario(id: string) {
  const res = await fetch(`${API_URL}/scenarios/${id}`);
  return res.json();
}

export async function simulateScenario(id: string) {
  const res = await fetch(`${API_URL}/scenarios/${id}/simulate`, {
    method: "POST",
  });
  return res.json();
}

export async function compareScenarios(idA: string, idB: string) {
  const res = await fetch(`${API_URL}/scenarios/${idA}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ compare_with: idB }),
  });
  return res.json();
}

export async function refineScenario(id: string, instruction: string) {
  const res = await fetch(`${API_URL}/scenarios/${id}/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instruction }),
  });
  return res.json();
}
