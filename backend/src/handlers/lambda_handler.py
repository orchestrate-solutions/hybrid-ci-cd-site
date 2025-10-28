"""AWS Lambda handler for serverless deployment."""

from mangum import Mangum
from src.main import app

# Create Lambda handler from FastAPI app
lambda_handler = Mangum(app, lifespan="off")
