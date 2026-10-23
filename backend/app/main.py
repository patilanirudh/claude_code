from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from .db import engine
from .graphql_schema import schema
from .models import Base

# No migration framework yet -- that's a deliberate gap, not an oversight.
# Schema/architecture governance (Feature 14) covers how this should evolve.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RiskPulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(GraphQLRouter(schema), prefix="/graphql")


@app.get("/health")
def health():
    return {"status": "ok"}
