"""Configuration management for the hybrid CI/CD backend."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # App
    app_name: str = "Hybrid CI/CD Backend"
    app_version: str = "0.1.0"
    environment: str = "development"
    
    # AWS Configuration
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    
    # DynamoDB Configuration
    dynamodb_endpoint_url: str = ""  # Leave empty for prod AWS, set to http://localhost:8000 for local
    dynamodb_table_sessions: str = "hybrid-ci-cd-sessions"
    dynamodb_table_jobs: str = "hybrid-ci-cd-jobs"
    dynamodb_table_agents: str = "hybrid-ci-cd-agents"
    
    # Session Configuration
    session_ttl_seconds: int = 86400  # 24 hours
    session_cookie_name: str = "hybrid_session_id"
    session_cookie_secure: bool = True
    session_cookie_httponly: bool = True
    session_cookie_samesite: str = "Strict"
    
    # OAuth 2.0 Configuration
    google_oauth_client_id: str = ""
    google_oauth_client_secret: str = ""
    github_oauth_client_id: str = ""
    github_oauth_client_secret: str = ""
    oauth_redirect_uri: str = "http://localhost:8000/oauth/callback"
    
    # CORS Configuration
    cors_origins: list[str] = ["http://localhost:3000"]
    
    # API Configuration
    api_prefix: str = "/api"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
