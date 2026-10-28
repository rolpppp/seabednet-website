from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_only_health_route_is_exposed():
    schema = client.get("/openapi.json").json()
    assert list(schema["paths"]) == ["/health"]
    application_paths = {
        route.path for route in app.routes if getattr(route, "include_in_schema", False)
    }
    assert application_paths == {"/health"}
