"""
CodeUChain chains for agent lifecycle workflows.
"""

from codeuchain.core import Context, Chain
from typing import Dict, Any

from src.components.links.agent_links import (
    ValidateAgentRegistrationLink, RegisterAgentLink, GetAgentLink, ListAgentsLink,
    GetHealthyAgentsLink, RecordAgentHeartbeatLink, UpdateAgentStatusLink,
    DeregisterAgentLink, SerializeAgentLink, SerializeAgentsListLink
)
from src.db.agent_store import AgentStoreInterface


class AgentRegistrationChain:
    """
    Chain to register a new agent:
    1. Validate registration request
    2. Register agent in store
    3. Serialize agent for response
    """
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.chain = Chain()
        self.chain.add_link(ValidateAgentRegistrationLink(), "validate")
        self.chain.add_link(RegisterAgentLink(agent_store), "register")
        self.chain.add_link(SerializeAgentLink(), "serialize")
        
        # Validation error predicate: only proceed to register if no validation error
        self.chain.connect("validate", "register", lambda ctx: ctx.get("validation_error") is None)
        
        # Connect register to serialize
        self.chain.connect("register", "serialize", lambda ctx: ctx.get("agent") is not None)
    
    async def run(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the chain with request data"""
        ctx = Context(request_data)
        result_ctx = await self.chain.run(ctx)
        
        # Return either error or agent response
        error = result_ctx.get("validation_error")
        if error:
            return {"error": error}
        
        return result_ctx.get("agent_response") or {}


class AgentHeartbeatChain:
    """
    Chain to process agent heartbeat and update metrics:
    1. Record heartbeat and metrics
    2. Serialize agent for response
    """
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.chain = Chain()
        self.chain.add_link(RecordAgentHeartbeatLink(agent_store), "record_heartbeat")
        self.chain.add_link(SerializeAgentLink(), "serialize")
        
        # Connect heartbeat to serialize
        self.chain.connect("record_heartbeat", "serialize", lambda ctx: ctx.get("agent") is not None)
    
    async def run(self, heartbeat_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the chain with heartbeat data"""
        ctx = Context(heartbeat_data)
        result_ctx = await self.chain.run(ctx)
        
        if result_ctx.get("agent") is None:
            return {"error": f"Agent {heartbeat_data.get('agent_id')} not found"}
        
        return result_ctx.get("agent_response") or {}


class ListAgentsChain:
    """
    Chain to list agents with optional filtering:
    1. List agents
    2. Serialize for response
    """
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.chain = Chain()
        self.chain.add_link(ListAgentsLink(agent_store), "list")
        self.chain.add_link(SerializeAgentsListLink(), "serialize")
        
        # Connect list to serialize
        self.chain.connect("list", "serialize", lambda ctx: True)
    
    async def run(self, pool_name: str = None, status: str = None, limit: int = 100) -> Dict[str, Any]:
        """Run the chain with optional filters"""
        data = {"limit": limit}
        if pool_name:
            data["pool_name"] = pool_name
        if status:
            data["status"] = status
        
        ctx = Context(data)
        result_ctx = await self.chain.run(ctx)
        
        agents = result_ctx.get("agents_response") or []
        return {
            "agents": agents,
            "total": len(agents),
            "pool_name": pool_name,
            "status": status,
        }


class GetHealthyAgentsChain:
    """
    Chain to get healthy agents available for job dispatch:
    1. Get healthy agents
    2. Serialize for response
    """
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.chain = Chain()
        self.chain.add_link(GetHealthyAgentsLink(agent_store), "get_healthy")
        self.chain.add_link(SerializeAgentsListLink(), "serialize")
        
        # Connect get_healthy to serialize (serialize expects "agents" key)
        self.chain.connect("get_healthy", "serialize", lambda ctx: (
            ctx.insert("agents", ctx.get("healthy_agents")) if ctx.get("healthy_agents") else ctx
        ))
    
    async def run(self, limit: int = 100) -> Dict[str, Any]:
        """Run the chain"""
        ctx = Context({"limit": limit})
        result_ctx = await self.chain.run(ctx)
        
        agents = result_ctx.get("agents_response") or []
        return {
            "healthy_agents": agents,
            "total": len(agents),
        }


class AgentStatusUpdateChain:
    """
    Chain to update agent status:
    1. Update status
    2. Serialize for response
    """
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.chain = Chain()
        self.chain.add_link(UpdateAgentStatusLink(agent_store), "update_status")
        self.chain.add_link(SerializeAgentLink(), "serialize")
        
        # Connect update to serialize
        self.chain.connect("update_status", "serialize", lambda ctx: ctx.get("agent") is not None)
    
    async def run(self, agent_id: str, status: str) -> Dict[str, Any]:
        """Run the chain with agent ID and new status"""
        ctx = Context({"agent_id": agent_id, "status": status})
        result_ctx = await self.chain.run(ctx)
        
        if result_ctx.get("agent") is None:
            return {"error": f"Agent {agent_id} not found"}
        
        return result_ctx.get("agent_response") or {}


class AgentDeregistrationChain:
    """
    Chain to deregister an agent:
    1. Deregister agent
    2. Serialize for response
    """
    
    def __init__(self, agent_store: AgentStoreInterface):
        self.chain = Chain()
        self.chain.add_link(DeregisterAgentLink(agent_store), "deregister")
        self.chain.add_link(SerializeAgentLink(), "serialize")
        
        # Connect deregister to serialize
        self.chain.connect("deregister", "serialize", lambda ctx: ctx.get("agent") is not None)
    
    async def run(self, agent_id: str) -> Dict[str, Any]:
        """Run the chain with agent ID"""
        ctx = Context({"agent_id": agent_id})
        result_ctx = await self.chain.run(ctx)
        
        if result_ctx.get("agent") is None:
            return {"error": f"Agent {agent_id} not found"}
        
        return result_ctx.get("agent_response") or {}
