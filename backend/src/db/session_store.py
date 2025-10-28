"""Session store implementations (in-memory and DynamoDB)."""

from abc import ABC, abstractmethod
from typing import Optional
import aioboto3
from src.db.models import SessionToken
from src.core.config import settings


class SessionStoreInterface(ABC):
    """Interface for session storage backends."""
    
    @abstractmethod
    async def create_session(
        self,
        user_id: str,
        provider: str,
        oauth_tokens: dict,
        user_info: dict,
    ) -> SessionToken:
        """Create a new session."""
        pass
    
    @abstractmethod
    async def validate_session(self, session_id: str) -> Optional[SessionToken]:
        """Validate and retrieve a session."""
        pass
    
    @abstractmethod
    async def invalidate_session(self, session_id: str) -> bool:
        """Invalidate (delete) a session."""
        pass
    
    @abstractmethod
    async def get_user_sessions(self, user_id: str) -> list[SessionToken]:
        """Get all sessions for a user."""
        pass


class InMemorySessionStore(SessionStoreInterface):
    """In-memory session store for development."""
    
    def __init__(self):
        """Initialize in-memory store."""
        self._sessions: dict[str, SessionToken] = {}
    
    async def create_session(
        self,
        user_id: str,
        provider: str,
        oauth_tokens: dict,
        user_info: dict,
    ) -> SessionToken:
        """Create a new session."""
        session = SessionToken.create(
            user_id=user_id,
            provider=provider,
            oauth_tokens=oauth_tokens,
            user_info=user_info,
            ttl_seconds=settings.session_ttl_seconds,
        )
        self._sessions[session.session_id] = session
        return session
    
    async def validate_session(self, session_id: str) -> Optional[SessionToken]:
        """Validate and retrieve a session."""
        session = self._sessions.get(session_id)
        if session and not session.is_expired():
            return session
        if session:
            del self._sessions[session_id]
        return None
    
    async def invalidate_session(self, session_id: str) -> bool:
        """Invalidate (delete) a session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False
    
    async def get_user_sessions(self, user_id: str) -> list[SessionToken]:
        """Get all sessions for a user."""
        sessions = [
            s for s in self._sessions.values()
            if s.user_id == user_id and not s.is_expired()
        ]
        # Clean up expired sessions
        expired = [
            s for s in self._sessions.values()
            if s.is_expired()
        ]
        for s in expired:
            del self._sessions[s.session_id]
        return sessions


class DynamoDBSessionStore(SessionStoreInterface):
    """DynamoDB session store for production."""
    
    def __init__(self, table_name: str = settings.dynamodb_table_sessions):
        """Initialize DynamoDB store."""
        self.table_name = table_name
        self.session = None
        self.dynamodb = None
    
    async def _get_table(self):
        """Get DynamoDB table resource."""
        if self.dynamodb is None:
            session_obj = aioboto3.Session()
            self.session = session_obj
            
            # Create DynamoDB client with optional local endpoint
            kwargs = {
                "region_name": settings.aws_region,
            }
            if settings.dynamodb_endpoint_url:
                kwargs["endpoint_url"] = settings.dynamodb_endpoint_url
            
            # Create DynamoDB resource
            async with self.session.resource("dynamodb", **kwargs) as dynamodb:
                self.dynamodb = dynamodb
                return await dynamodb.Table(self.table_name)
        
        return await self.session.resource("dynamodb", region_name=settings.aws_region).Table(self.table_name)
    
    async def create_session(
        self,
        user_id: str,
        provider: str,
        oauth_tokens: dict,
        user_info: dict,
    ) -> SessionToken:
        """Create a new session in DynamoDB."""
        session = SessionToken.create(
            user_id=user_id,
            provider=provider,
            oauth_tokens=oauth_tokens,
            user_info=user_info,
            ttl_seconds=settings.session_ttl_seconds,
        )
        
        # Get DynamoDB client
        session_obj = aioboto3.Session()
        async with session_obj.client(
            "dynamodb",
            region_name=settings.aws_region,
            endpoint_url=settings.dynamodb_endpoint_url or None,
        ) as dynamodb:
            # Put item
            await dynamodb.put_item(
                TableName=self.table_name,
                Item={
                    "session_id": {"S": session.session_id},
                    "user_id": {"S": session.user_id},
                    "provider": {"S": session.provider},
                    "created_at": {"N": str(session.created_at)},
                    "expires_at": {"N": str(session.expires_at)},
                    "oauth_tokens": {"S": str(session.oauth_tokens)},  # Simplified
                    "user_info": {"S": str(session.user_info)},  # Simplified
                },
            )
        
        return session
    
    async def validate_session(self, session_id: str) -> Optional[SessionToken]:
        """Validate and retrieve a session from DynamoDB."""
        session_obj = aioboto3.Session()
        async with session_obj.client(
            "dynamodb",
            region_name=settings.aws_region,
            endpoint_url=settings.dynamodb_endpoint_url or None,
        ) as dynamodb:
            response = await dynamodb.get_item(
                TableName=self.table_name,
                Key={"session_id": {"S": session_id}},
            )
        
        if "Item" not in response:
            return None
        
        # Parse DynamoDB item
        item = response["Item"]
        session = SessionToken(
            session_id=item["session_id"]["S"],
            user_id=item["user_id"]["S"],
            provider=item["provider"]["S"],
            created_at=int(item["created_at"]["N"]),
            expires_at=int(item["expires_at"]["N"]),
            oauth_tokens=eval(item["oauth_tokens"]["S"]),  # Simplified parsing
            user_info=eval(item["user_info"]["S"]),  # Simplified parsing
        )
        
        if session.is_expired():
            await self.invalidate_session(session_id)
            return None
        
        return session
    
    async def invalidate_session(self, session_id: str) -> bool:
        """Invalidate (delete) a session from DynamoDB."""
        session_obj = aioboto3.Session()
        async with session_obj.client(
            "dynamodb",
            region_name=settings.aws_region,
            endpoint_url=settings.dynamodb_endpoint_url or None,
        ) as dynamodb:
            await dynamodb.delete_item(
                TableName=self.table_name,
                Key={"session_id": {"S": session_id}},
            )
        return True
    
    async def get_user_sessions(self, user_id: str) -> list[SessionToken]:
        """Get all sessions for a user from DynamoDB."""
        session_obj = aioboto3.Session()
        async with session_obj.client(
            "dynamodb",
            region_name=settings.aws_region,
            endpoint_url=settings.dynamodb_endpoint_url or None,
        ) as dynamodb:
            # Query by GSI (user_id)
            response = await dynamodb.query(
                TableName=self.table_name,
                IndexName="user_id-created_at-index",  # GSI name
                KeyConditionExpression="user_id = :uid",
                ExpressionAttributeValues={":uid": {"S": user_id}},
            )
        
        sessions = []
        for item in response.get("Items", []):
            session = SessionToken(
                session_id=item["session_id"]["S"],
                user_id=item["user_id"]["S"],
                provider=item["provider"]["S"],
                created_at=int(item["created_at"]["N"]),
                expires_at=int(item["expires_at"]["N"]),
                oauth_tokens=eval(item["oauth_tokens"]["S"]),
                user_info=eval(item["user_info"]["S"]),
            )
            if not session.is_expired():
                sessions.append(session)
        
        return sessions
