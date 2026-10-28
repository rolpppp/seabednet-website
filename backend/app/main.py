from fastapi import FastAPI

app = FastAPI(title="SeaBed Lens API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
