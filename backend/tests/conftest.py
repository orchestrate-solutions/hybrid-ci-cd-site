"""Test configuration and fixtures."""

import pytest
import asyncio

# Try to import main app, but make it optional
MAIN_APP_AVAILABLE = True
try:
    from fastapi.testclient import TestClient
    from moto import mock_aws
    import boto3
    from src.main import app
    from src.core.config import settings
except (ImportError, ModuleNotFoundError) as e:
    MAIN_APP_AVAILABLE = False
    print(f"⚠️  Main app imports unavailable (webhook tests don't need it)")


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """Create test client."""
    if not MAIN_APP_AVAILABLE:
        pytest.skip("Main app not available")
    return TestClient(app)


@pytest.fixture
def mock_dynamodb_table():
    """Create mock DynamoDB table for testing."""
    if not MAIN_APP_AVAILABLE:
        pytest.skip("DynamoDB fixtures not available")
    
    with mock_aws():
        # Create DynamoDB resource
        dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
        
        # Create sessions table
        table = dynamodb.create_table(
            TableName=settings.dynamodb_table_sessions,
            KeySchema=[
                {"AttributeName": "session_id", "KeyType": "HASH"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "session_id", "AttributeType": "S"},
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "created_at", "AttributeType": "N"},
            ],
            BillingMode="PAY_PER_REQUEST",
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "user_id-created_at-index",
                    "KeySchema": [
                        {"AttributeName": "user_id", "KeyType": "HASH"},
                        {"AttributeName": "created_at", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5,
                    },
                }
            ],
            ProvisionedThroughput={
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5,
            },
        )
        
        yield table
