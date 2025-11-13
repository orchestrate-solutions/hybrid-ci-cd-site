"""
Relay registration and management endpoints for NET ZERO risk architecture.

This module provides endpoints for:
- Relay registration (OAuth2-based)
- API key generation for queue message verification
- Relay metadata storage and retrieval
- Relay health monitoring

Relays are deployed on user's infrastructure and forward sanitized webhook
metadata to user's queue. Provider polls queue for routing decisions only.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import secrets
import hashlib
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/relays", tags=["relays"])


# ============================================================================
# Request/Response Models
# ============================================================================

class RelayRegistrationRequest(BaseModel):
    """Request to register a new relay."""
    relay_name: str = Field(..., description="Human-readable relay name")
    queue_config: Dict[str, Any] = Field(..., description="User's queue configuration")
    vault_config: Dict[str, Any] = Field(..., description="User's vault configuration")
    oauth_token: str = Field(..., description="OAuth2 access token for authentication")
    
    class Config:
        json_schema_extra = {
            "example": {
                "relay_name": "Production GitHub Actions Relay",
                "queue_config": {
                    "provider": "aws_sqs",
                    "queue_url": "https://sqs.us-east-1.amazonaws.com/123456789012/relay-queue",
                    "role_arn": "arn:aws:iam::123456789012:role/RelayPollerRole",
                    "region": "us-east-1"
                },
                "vault_config": {
                    "provider": "aws_secrets_manager",
                    "region": "us-east-1",
                    "secret_prefix": "hybrid-ci-cd/"
                },
                "oauth_token": "ya29.a0AfH6SMBx..."
            }
        }


class RelayRegistrationResponse(BaseModel):
    """Response after successful relay registration."""
    relay_id: str = Field(..., description="Unique relay identifier (UUID)")
    api_key: str = Field(..., description="API key for relay authentication (one-time display)")
    relay_name: str
    queue_config: Dict[str, Any]
    created_at: str
    expires_at: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "relay_id": "relay_a1b2c3d4e5f6",
                "api_key": "sk_relay_1234567890abcdefghijklmnopqrstuvwxyz",
                "relay_name": "Production GitHub Actions Relay",
                "queue_config": {
                    "provider": "aws_sqs",
                    "queue_url": "https://sqs.us-east-1.amazonaws.com/123456789012/relay-queue"
                },
                "created_at": "2025-11-12T10:00:00Z",
                "expires_at": "2026-11-12T10:00:00Z"
            }
        }


class RelayHealthRequest(BaseModel):
    """Relay health heartbeat request."""
    relay_id: str
    status: str = Field(..., description="healthy | degraded | unhealthy")
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "relay_id": "relay_a1b2c3d4e5f6",
                "status": "healthy",
                "metadata": {
                    "version": "1.0.0",
                    "uptime_seconds": 86400,
                    "messages_processed": 1234
                }
            }
        }


class RelayMetadata(BaseModel):
    """Relay metadata (stored in-memory for MVP)."""
    relay_id: str
    relay_name: str
    queue_config: Dict[str, Any]
    vault_config: Dict[str, Any]
    api_key_hash: str  # SHA-256 hash of API key (never store plaintext)
    created_at: datetime
    expires_at: datetime
    last_heartbeat: Optional[datetime] = None
    status: str = "pending"  # pending | healthy | degraded | unhealthy


# ============================================================================
# In-Memory Store (MVP - Replace with DynamoDB in production)
# ============================================================================

class InMemoryRelayStore:
    """In-memory relay metadata store for MVP."""
    
    def __init__(self):
        self._relays: Dict[str, RelayMetadata] = {}
    
    def save(self, relay: RelayMetadata) -> None:
        """Save relay metadata."""
        self._relays[relay.relay_id] = relay
    
    def get(self, relay_id: str) -> Optional[RelayMetadata]:
        """Get relay by ID."""
        return self._relays.get(relay_id)
    
    def list_all(self) -> list[RelayMetadata]:
        """List all relays."""
        return list(self._relays.values())
    
    def delete(self, relay_id: str) -> bool:
        """Delete relay."""
        if relay_id in self._relays:
            del self._relays[relay_id]
            return True
        return False
    
    def update_heartbeat(self, relay_id: str, status: str) -> bool:
        """Update relay heartbeat timestamp and status."""
        relay = self._relays.get(relay_id)
        if relay:
            relay.last_heartbeat = datetime.utcnow()
            relay.status = status
            return True
        return False


# Global store instance (MVP)
relay_store = InMemoryRelayStore()


# ============================================================================
# OAuth2 Token Validation (Placeholder)
# ============================================================================

async def validate_oauth_token(oauth_token: str) -> Dict[str, Any]:
    """
    Validate OAuth2 token and extract user identity.
    
    TODO: Implement real OAuth2 validation:
    - Verify token signature (JWT)
    - Check token expiration
    - Validate issuer (auth0, google, github, etc.)
    - Extract user_id, email, scopes
    
    For MVP, we accept any non-empty token.
    """
    if not oauth_token or len(oauth_token) < 10:
        raise HTTPException(status_code=401, detail="Invalid OAuth token")
    
    # Placeholder: Return mock user identity
    return {
        "user_id": "user_mock_123",
        "email": "user@example.com",
        "scopes": ["relay:register", "relay:manage"]
    }


# ============================================================================
# API Key Generation and Verification
# ============================================================================

def generate_api_key() -> str:
    """Generate a secure API key for relay authentication."""
    # Generate 32 bytes of random data, base64 encode
    random_bytes = secrets.token_bytes(32)
    api_key = f"sk_relay_{secrets.token_urlsafe(32)}"
    return api_key


def hash_api_key(api_key: str) -> str:
    """Hash API key for storage (SHA-256)."""
    return hashlib.sha256(api_key.encode()).hexdigest()


def verify_api_key(provided_key: str, stored_hash: str) -> bool:
    """Verify provided API key against stored hash."""
    return hash_api_key(provided_key) == stored_hash


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/register", response_model=RelayRegistrationResponse)
async def register_relay(request: RelayRegistrationRequest) -> RelayRegistrationResponse:
    """
    Register a new relay with OAuth2 authentication.
    
    Process:
    1. Validate OAuth2 token
    2. Generate unique relay_id
    3. Generate API key for queue message verification
    4. Store relay metadata (queue config, vault config, API key hash)
    5. Return relay_id + API key (one-time display)
    
    Security:
    - API key is shown ONCE during registration
    - Only hash is stored (never plaintext)
    - User must save API key in their vault
    - API key is used to sign queue messages (relay → user queue)
    """
    try:
        # Validate OAuth2 token
        user_identity = await validate_oauth_token(request.oauth_token)
        logger.info(f"Relay registration by user: {user_identity.get('user_id')}")
        
        # Generate relay_id (unique identifier)
        relay_id = f"relay_{secrets.token_hex(12)}"
        
        # Generate API key (secure random)
        api_key = generate_api_key()
        api_key_hash = hash_api_key(api_key)
        
        # Set expiration (1 year from now)
        created_at = datetime.utcnow()
        expires_at = created_at + timedelta(days=365)
        
        # Create relay metadata
        relay_metadata = RelayMetadata(
            relay_id=relay_id,
            relay_name=request.relay_name,
            queue_config=request.queue_config,
            vault_config=request.vault_config,
            api_key_hash=api_key_hash,
            created_at=created_at,
            expires_at=expires_at,
            status="pending"
        )
        
        # Save to store
        relay_store.save(relay_metadata)
        
        logger.info(f"Registered relay: {relay_id} ({request.relay_name})")
        
        # Return response (API key shown ONCE)
        return RelayRegistrationResponse(
            relay_id=relay_id,
            api_key=api_key,  # ⚠️ One-time display
            relay_name=request.relay_name,
            queue_config=request.queue_config,
            created_at=created_at.isoformat(),
            expires_at=expires_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Relay registration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/heartbeat")
async def relay_heartbeat(
    request: RelayHealthRequest,
    x_api_key: str = Header(..., alias="X-API-Key")
) -> Dict[str, Any]:
    """
    Relay health heartbeat endpoint.
    
    Relays send periodic heartbeats to indicate they're alive and healthy.
    Provider uses this to monitor relay status and alert on failures.
    
    Authentication: X-API-Key header (relay's API key)
    """
    try:
        # Get relay metadata
        relay = relay_store.get(request.relay_id)
        if not relay:
            raise HTTPException(status_code=404, detail="Relay not found")
        
        # Verify API key
        if not verify_api_key(x_api_key, relay.api_key_hash):
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Update heartbeat timestamp and status
        relay_store.update_heartbeat(request.relay_id, request.status)
        
        logger.info(f"Heartbeat from relay {request.relay_id}: {request.status}")
        
        return {
            "relay_id": request.relay_id,
            "status": "heartbeat_received",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Heartbeat failed: {e}")
        raise HTTPException(status_code=500, detail=f"Heartbeat failed: {str(e)}")


@router.get("/{relay_id}")
async def get_relay(
    relay_id: str,
    x_api_key: str = Header(..., alias="X-API-Key")
) -> Dict[str, Any]:
    """
    Get relay metadata.
    
    Authentication: X-API-Key header (relay's API key)
    """
    try:
        relay = relay_store.get(relay_id)
        if not relay:
            raise HTTPException(status_code=404, detail="Relay not found")
        
        # Verify API key
        if not verify_api_key(x_api_key, relay.api_key_hash):
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        return {
            "relay_id": relay.relay_id,
            "relay_name": relay.relay_name,
            "status": relay.status,
            "created_at": relay.created_at.isoformat(),
            "expires_at": relay.expires_at.isoformat(),
            "last_heartbeat": relay.last_heartbeat.isoformat() if relay.last_heartbeat else None,
            "queue_config": {
                "provider": relay.queue_config.get("provider"),
                "queue_url": relay.queue_config.get("queue_url")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get relay failed: {e}")
        raise HTTPException(status_code=500, detail=f"Get relay failed: {str(e)}")


@router.delete("/{relay_id}")
async def delete_relay(
    relay_id: str,
    x_api_key: str = Header(..., alias="X-API-Key")
) -> Dict[str, Any]:
    """
    Delete relay registration.
    
    Authentication: X-API-Key header (relay's API key)
    """
    try:
        relay = relay_store.get(relay_id)
        if not relay:
            raise HTTPException(status_code=404, detail="Relay not found")
        
        # Verify API key
        if not verify_api_key(x_api_key, relay.api_key_hash):
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Delete relay
        relay_store.delete(relay_id)
        
        logger.info(f"Deleted relay: {relay_id}")
        
        return {
            "relay_id": relay_id,
            "status": "deleted",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete relay failed: {e}")
        raise HTTPException(status_code=500, detail=f"Delete relay failed: {str(e)}")


@router.get("/")
async def list_relays() -> Dict[str, Any]:
    """
    List all registered relays.
    
    TODO: Add pagination and filtering in production.
    TODO: Add authentication (admin-only endpoint).
    """
    try:
        relays = relay_store.list_all()
        
        return {
            "relays": [
                {
                    "relay_id": r.relay_id,
                    "relay_name": r.relay_name,
                    "status": r.status,
                    "created_at": r.created_at.isoformat(),
                    "last_heartbeat": r.last_heartbeat.isoformat() if r.last_heartbeat else None,
                    "queue_provider": r.queue_config.get("provider")
                }
                for r in relays
            ],
            "total": len(relays)
        }
        
    except Exception as e:
        logger.error(f"List relays failed: {e}")
        raise HTTPException(status_code=500, detail=f"List relays failed: {str(e)}")
