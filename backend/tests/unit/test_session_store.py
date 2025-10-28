"""Unit tests for session store implementations."""

import pytest
from src.db.session_store import InMemorySessionStore
from src.db.models import SessionToken


@pytest.mark.asyncio
async def test_in_memory_create_session():
    """Test creating a session."""
    store = InMemorySessionStore()
    
    session = await store.create_session(
        user_id="user123",
        provider="google",
        oauth_tokens={"access_token": "test_token"},
        user_info={"email": "user@example.com"},
    )
    
    assert session.session_id is not None
    assert session.user_id == "user123"
    assert session.provider == "google"
    assert not session.is_expired()


@pytest.mark.asyncio
async def test_in_memory_validate_session():
    """Test validating a session."""
    store = InMemorySessionStore()
    
    session = await store.create_session(
        user_id="user123",
        provider="google",
        oauth_tokens={"access_token": "test_token"},
        user_info={"email": "user@example.com"},
    )
    
    # Validate existing session
    validated = await store.validate_session(session.session_id)
    assert validated is not None
    assert validated.user_id == "user123"


@pytest.mark.asyncio
async def test_in_memory_invalidate_session():
    """Test invalidating a session."""
    store = InMemorySessionStore()
    
    session = await store.create_session(
        user_id="user123",
        provider="google",
        oauth_tokens={"access_token": "test_token"},
        user_info={"email": "user@example.com"},
    )
    
    # Invalidate session
    result = await store.invalidate_session(session.session_id)
    assert result is True
    
    # Validate should return None
    validated = await store.validate_session(session.session_id)
    assert validated is None


@pytest.mark.asyncio
async def test_in_memory_get_user_sessions():
    """Test getting all sessions for a user."""
    store = InMemorySessionStore()
    
    # Create multiple sessions
    session1 = await store.create_session(
        user_id="user123",
        provider="google",
        oauth_tokens={"access_token": "token1"},
        user_info={"email": "user@example.com"},
    )
    
    session2 = await store.create_session(
        user_id="user123",
        provider="github",
        oauth_tokens={"access_token": "token2"},
        user_info={"email": "user@github.com"},
    )
    
    session3 = await store.create_session(
        user_id="other_user",
        provider="google",
        oauth_tokens={"access_token": "token3"},
        user_info={"email": "other@example.com"},
    )
    
    # Get sessions for user123
    sessions = await store.get_user_sessions("user123")
    assert len(sessions) == 2
    assert all(s.user_id == "user123" for s in sessions)


@pytest.mark.asyncio
async def test_session_token_expiration():
    """Test session expiration logic."""
    store = InMemorySessionStore()
    
    # Create session with very short TTL
    session = SessionToken.create(
        user_id="user123",
        provider="google",
        oauth_tokens={},
        user_info={},
        ttl_seconds=1,  # 1 second TTL
    )
    
    # Should not be expired immediately
    assert not session.is_expired()
    
    # Wait 2 seconds
    import time
    time.sleep(2)
    
    # Should be expired now
    assert session.is_expired()
