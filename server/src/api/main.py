from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.router import router

app = FastAPI(title="FastAPI wind_turbine_maintenance")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
)

app.include_router(router)

@app.get("/")
async def root():
    return {"message": "Welcome to wind turbine maintenance API"}