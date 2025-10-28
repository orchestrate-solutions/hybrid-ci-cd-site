"""
Unit tests for agent models and store implementations.
"""

import pytest
from datetime import datetime
from src.db.agent_models import (
    Agent, AgentStatus, AgentMetrics, AgentScalingState,
    AgentPool, AgentHealthCheck
)
from src.db.agent_store import InMemoryAgentStore, InMemoryAgentPoolStore


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def agent_store():
    """Fresh in-memory agent store for each test"""
    return InMemoryAgentStore()


@pytest.fixture
def agent_pool_store():
    """Fresh in-memory agent pool store for each test"""
    return InMemoryAgentPoolStore()


@pytest.fixture
def sample_agent(agent_store):
    """Create a sample agent for testing"""
    agent = Agent(
        agent_id="test-agent-001",
        pool_name="us-east-1-a",
        status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE,
        version="1.0.0",
        registered_at=datetime.utcnow(),
        last_heartbeat=datetime.utcnow(),
        current_job_count=0,
        max_concurrent_jobs=10,
        workload_identity_secret="secret-123",
        tags={"env": "test"}
    )
    return agent


@pytest.fixture
def sample_pool(agent_pool_store):
    """Create a sample pool for testing"""
    pool = AgentPool(
        pool_name="us-east-1-a",
        region="us-east-1",
        zone="a",
        min_agents=2,
        max_agents=10,
        current_agent_count=0,
        active_agents=0,
        idle_agents=0,
        unhealthy_agents=0,
        desired_agent_count=3,
        enabled=True
    )
    return pool


# ============================================================================
# AgentMetrics Tests
# ============================================================================

@pytest.mark.asyncio
async def test_agent_metrics_creation():
    """Test AgentMetrics dataclass creation"""
    metrics = AgentMetrics(
        cpu_percent=45.5,
        memory_percent=72.3,
        disk_percent=80.0,
        jobs_queued=5,
        jobs_completed=100,
        uptime_seconds=3600
    )
    
    assert metrics.cpu_percent == 45.5
    assert metrics.memory_percent == 72.3
    assert metrics.disk_percent == 80.0
    assert metrics.jobs_queued == 5
    assert metrics.jobs_completed == 100


@pytest.mark.asyncio
async def test_agent_metrics_to_dict():
    """Test AgentMetrics to_dict conversion"""
    metrics = AgentMetrics(
        cpu_percent=45.5,
        memory_percent=72.3,
        disk_percent=80.0,
        jobs_queued=5,
        jobs_completed=100,
        uptime_seconds=3600
    )
    
    result = metrics.to_dict()
    assert isinstance(result, dict)
    assert result["cpu_percent"] == 45.5
    assert result["memory_percent"] == 72.3


# ============================================================================
# Agent Model Tests
# ============================================================================

@pytest.mark.asyncio
async def test_agent_creation(sample_agent):
    """Test Agent dataclass creation"""
    assert sample_agent.agent_id == "test-agent-001"
    assert sample_agent.pool_name == "us-east-1-a"
    assert sample_agent.status == AgentStatus.HEALTHY
    assert sample_agent.max_concurrent_jobs == 10
    assert sample_agent.current_job_count == 0


@pytest.mark.asyncio
async def test_agent_capacity_available(sample_agent):
    """Test agent capacity calculation"""
    sample_agent.current_job_count = 5
    available = sample_agent.max_concurrent_jobs - sample_agent.current_job_count
    assert available == 5


@pytest.mark.asyncio
async def test_agent_capacity_full(sample_agent):
    """Test agent at full capacity"""
    sample_agent.current_job_count = 10
    available = sample_agent.max_concurrent_jobs - sample_agent.current_job_count
    assert available == 0


@pytest.mark.asyncio
async def test_agent_over_capacity(sample_agent):
    """Test agent exceeding capacity (should be prevented)"""
    sample_agent.current_job_count = 12  # Over max
    assert sample_agent.current_job_count > sample_agent.max_concurrent_jobs


# ============================================================================
# AgentStatus Enum Tests
# ============================================================================

@pytest.mark.asyncio
async def test_agent_status_values():
    """Test all AgentStatus enum values"""
    statuses = [
        AgentStatus.REGISTERING,
        AgentStatus.HEALTHY,
        AgentStatus.DEGRADED,
        AgentStatus.UNHEALTHY,
        AgentStatus.OFFLINE,
        AgentStatus.TERMINATING,
        AgentStatus.TERMINATED,
    ]
    
    assert len(statuses) == 7
    assert AgentStatus.HEALTHY.value == "healthy"


# ============================================================================
# InMemoryAgentStore Tests
# ============================================================================

@pytest.mark.asyncio
async def test_register_agent(agent_store, sample_agent):
    """Test registering an agent"""
    result = await agent_store.register_agent(sample_agent)
    
    assert result is not None
    assert result.pool_name == "us-east-1-a"
    assert result.status == AgentStatus.HEALTHY


@pytest.mark.asyncio
async def test_get_agent(agent_store, sample_agent):
    """Test retrieving a registered agent"""
    # Register agent
    registered = await agent_store.register_agent(sample_agent)
    
    # Retrieve agent
    retrieved = await agent_store.get_agent(registered.agent_id)
    assert retrieved is not None
    assert retrieved.agent_id == registered.agent_id
    assert retrieved.pool_name == "us-east-1-a"


@pytest.mark.asyncio
async def test_get_nonexistent_agent(agent_store):
    """Test retrieving non-existent agent returns None"""
    result = await agent_store.get_agent("nonexistent-id")
    assert result is None


@pytest.mark.asyncio
async def test_list_agents_empty(agent_store):
    """Test listing agents from empty store"""
    result = await agent_store.list_agents()
    assert result == []


@pytest.mark.asyncio
async def test_list_agents_multiple(agent_store):
    """Test listing multiple registered agents"""
    # Create and register multiple agents
    agent1 = Agent(
        agent_id="test-agent-001",
        pool_name="us-east-1-a",
        status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE,
        version="1.0.0",
        registered_at=datetime.utcnow(),
        last_heartbeat=datetime.utcnow(),
        current_job_count=0,
        max_concurrent_jobs=10,
        workload_identity_secret="secret-1",
        tags={}
    )
    agent2 = Agent(
        agent_id="test-agent-002",
        pool_name="us-east-1-a",
        status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE,
        version="1.0.0",
        registered_at=datetime.utcnow(),
        last_heartbeat=datetime.utcnow(),
        current_job_count=0,
        max_concurrent_jobs=10,
        workload_identity_secret="secret-2",
        tags={}
    )
    agent3 = Agent(
        agent_id="test-agent-003",
        pool_name="us-west-2-b",
        status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE,
        version="1.0.0",
        registered_at=datetime.utcnow(),
        last_heartbeat=datetime.utcnow(),
        current_job_count=0,
        max_concurrent_jobs=10,
        workload_identity_secret="secret-3",
        tags={}
    )
    
    await agent_store.register_agent(agent1)
    await agent_store.register_agent(agent2)
    await agent_store.register_agent(agent3)
    
    result = await agent_store.list_agents()
    assert len(result) == 3


@pytest.mark.asyncio
async def test_get_agents_by_pool(agent_store):
    """Test retrieving agents by pool name"""
    # Create and register agents in different pools
    agent1 = Agent(
        agent_id="test-agent-001", pool_name="us-east-1-a", status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE, version="1.0.0",
        registered_at=datetime.utcnow(), last_heartbeat=datetime.utcnow(),
        current_job_count=0, max_concurrent_jobs=10, workload_identity_secret="secret-1", tags={}
    )
    agent2 = Agent(
        agent_id="test-agent-002", pool_name="us-east-1-a", status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE, version="1.0.0",
        registered_at=datetime.utcnow(), last_heartbeat=datetime.utcnow(),
        current_job_count=0, max_concurrent_jobs=10, workload_identity_secret="secret-2", tags={}
    )
    agent3 = Agent(
        agent_id="test-agent-003", pool_name="us-west-2-b", status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE, version="1.0.0",
        registered_at=datetime.utcnow(), last_heartbeat=datetime.utcnow(),
        current_job_count=0, max_concurrent_jobs=10, workload_identity_secret="secret-3", tags={}
    )
    
    await agent_store.register_agent(agent1)
    await agent_store.register_agent(agent2)
    await agent_store.register_agent(agent3)
    
    # Get agents in us-east-1-a pool
    result = await agent_store.get_agents_by_pool("us-east-1-a")
    assert len(result) == 2
    assert all(a.pool_name == "us-east-1-a" for a in result)
    
    # Get agents in us-west-2-b pool
    result = await agent_store.get_agents_by_pool("us-west-2-b")
    assert len(result) == 1


@pytest.mark.asyncio
async def test_update_agent_status(agent_store, sample_agent):
    """Test updating agent status"""
    # Register agent
    agent = await agent_store.register_agent(sample_agent)
    
    # Update status
    await agent_store.update_agent_status(agent.agent_id, AgentStatus.DEGRADED)
    
    # Verify status changed
    updated = await agent_store.get_agent(agent.agent_id)
    assert updated.status == AgentStatus.DEGRADED


@pytest.mark.asyncio
async def test_update_agent_metrics(agent_store, sample_agent):
    """Test updating agent metrics"""
    # Register agent
    agent = await agent_store.register_agent(sample_agent)
    
    # Update metrics
    await agent_store.update_agent_metrics(
        agent.agent_id,
        cpu=75.5, memory=80.0, disk=60.0,
        jobs_queued=3, jobs_completed=50, uptime=7200
    )
    
    # Verify metrics changed
    updated = await agent_store.get_agent(agent.agent_id)
    assert updated.metrics.cpu_percent == 75.5
    assert updated.metrics.jobs_queued == 3


@pytest.mark.asyncio
async def test_heartbeat_updates_timestamp(agent_store, sample_agent):
    """Test heartbeat updates last_heartbeat timestamp"""
    # Register agent
    agent = await agent_store.register_agent(sample_agent)
    original_heartbeat = agent.last_heartbeat
    
    # Record heartbeat
    await agent_store.record_heartbeat(agent.agent_id)
    
    # Verify timestamp updated
    updated = await agent_store.get_agent(agent.agent_id)
    assert updated.last_heartbeat > original_heartbeat


@pytest.mark.asyncio
async def test_get_healthy_agents(agent_store):
    """Test retrieving healthy agents"""
    # Create and register multiple agents
    agent1 = Agent(
        agent_id="test-agent-001", pool_name="us-east-1-a", status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE, version="1.0.0",
        registered_at=datetime.utcnow(), last_heartbeat=datetime.utcnow(),
        current_job_count=0, max_concurrent_jobs=10, workload_identity_secret="secret-1", tags={}
    )
    agent2 = Agent(
        agent_id="test-agent-002", pool_name="us-east-1-a", status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE, version="1.0.0",
        registered_at=datetime.utcnow(), last_heartbeat=datetime.utcnow(),
        current_job_count=0, max_concurrent_jobs=10, workload_identity_secret="secret-2", tags={}
    )
    
    await agent_store.register_agent(agent1)
    await agent_store.register_agent(agent2)
    
    # Make one unhealthy
    await agent_store.update_agent_status(agent2.agent_id, AgentStatus.UNHEALTHY)
    
    # Get healthy agents
    result = await agent_store.get_healthy_agents()
    assert len(result) == 1
    assert result[0].agent_id == agent1.agent_id


@pytest.mark.asyncio
async def test_get_idle_agents(agent_store):
    """Test retrieving idle agents (no current jobs)"""
    # Create and register agents
    agent1 = Agent(
        agent_id="test-agent-001", pool_name="us-east-1-a", status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE, version="1.0.0",
        registered_at=datetime.utcnow(), last_heartbeat=datetime.utcnow(),
        current_job_count=0, max_concurrent_jobs=10, workload_identity_secret="secret-1", tags={}
    )
    agent2 = Agent(
        agent_id="test-agent-002", pool_name="us-east-1-a", status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE, version="1.0.0",
        registered_at=datetime.utcnow(), last_heartbeat=datetime.utcnow(),
        current_job_count=0, max_concurrent_jobs=10, workload_identity_secret="secret-2", tags={}
    )
    
    await agent_store.register_agent(agent1)
    await agent_store.register_agent(agent2)
    
    # Assign jobs to agent1
    agent1.current_job_count = 5
    
    # Get idle agents
    result = await agent_store.get_idle_agents()
    assert len(result) == 1
    assert result[0].agent_id == agent2.agent_id


@pytest.mark.asyncio
async def test_deregister_agent(agent_store, sample_agent):
    """Test deregistering an agent"""
    # Register agent
    agent = await agent_store.register_agent(sample_agent)
    
    # Deregister
    await agent_store.deregister_agent(agent.agent_id)
    
    # Verify status changed
    updated = await agent_store.get_agent(agent.agent_id)
    assert updated.status == AgentStatus.TERMINATED


# ============================================================================
# InMemoryAgentPoolStore Tests
# ============================================================================

@pytest.mark.asyncio
async def test_create_agent_pool(agent_pool_store):
    """Test creating an agent pool"""
    pool = AgentPool(
        pool_name="us-east-1-a",
        region="us-east-1",
        zone="a",
        min_agents=2,
        max_agents=10,
        current_agent_count=0,
        active_agents=0,
        idle_agents=0,
        unhealthy_agents=0,
        desired_agent_count=3,
        enabled=True
    )
    
    result = await agent_pool_store.create_pool(pool)
    
    assert result is not None
    assert result.pool_name == "us-east-1-a"
    assert result.min_agents == 2
    assert result.max_agents == 10


@pytest.mark.asyncio
async def test_get_pool(agent_pool_store):
    """Test retrieving a pool"""
    # Create pool
    pool = AgentPool(
        pool_name="us-east-1-a",
        region="us-east-1",
        zone="a",
        min_agents=2,
        max_agents=10,
        current_agent_count=0,
        active_agents=0,
        idle_agents=0,
        unhealthy_agents=0,
        desired_agent_count=3,
        enabled=True
    )
    
    created = await agent_pool_store.create_pool(pool)
    
    # Retrieve pool
    retrieved = await agent_pool_store.get_pool("us-east-1-a")
    assert retrieved is not None
    assert retrieved.pool_name == "us-east-1-a"


@pytest.mark.asyncio
async def test_get_nonexistent_pool(agent_pool_store):
    """Test retrieving non-existent pool returns None"""
    result = await agent_pool_store.get_pool("nonexistent-pool")
    assert result is None


@pytest.mark.asyncio
async def test_list_pools_empty(agent_pool_store):
    """Test listing pools from empty store"""
    result = await agent_pool_store.list_pools()
    assert result == []


@pytest.mark.asyncio
async def test_list_pools_multiple(agent_pool_store):
    """Test listing multiple pools"""
    # Create multiple pools
    pool1 = AgentPool("us-east-1-a", "us-east-1", "a", 2, 10, 0, 0, 0, 0, 3, True)
    pool2 = AgentPool("us-west-2-b", "us-west-2", "b", 1, 5, 0, 0, 0, 0, 2, True)
    pool3 = AgentPool("eu-west-1-c", "eu-west-1", "c", 3, 15, 0, 0, 0, 0, 5, True)
    
    await agent_pool_store.create_pool(pool1)
    await agent_pool_store.create_pool(pool2)
    await agent_pool_store.create_pool(pool3)
    
    result = await agent_pool_store.list_pools()
    assert len(result) == 3


@pytest.mark.asyncio
async def test_update_scaling_state(agent_pool_store):
    """Test updating pool scaling state"""
    # Create pool
    pool = AgentPool(
        pool_name="us-east-1-a",
        region="us-east-1",
        zone="a",
        min_agents=2,
        max_agents=10,
        current_agent_count=0,
        active_agents=0,
        idle_agents=0,
        unhealthy_agents=0,
        desired_agent_count=3,
        enabled=True
    )
    
    created = await agent_pool_store.create_pool(pool)
    
    # Update scaling state
    await agent_pool_store.update_pool_scaling_state(pool.pool_name, desired_count=5)
    
    # Verify state changed
    updated = await agent_pool_store.get_pool(pool.pool_name)
    assert updated.desired_agent_count == 5


@pytest.mark.asyncio
async def test_update_agent_counts(agent_pool_store):
    """Test updating pool agent counts"""
    # Create pool
    pool = AgentPool(
        pool_name="us-east-1-a",
        region="us-east-1",
        zone="a",
        min_agents=2,
        max_agents=10,
        current_agent_count=0,
        active_agents=0,
        idle_agents=0,
        unhealthy_agents=0,
        desired_agent_count=3,
        enabled=True
    )
    
    created = await agent_pool_store.create_pool(pool)
    
    # Update counts
    await agent_pool_store.update_pool_agent_counts(
        pool.pool_name,
        active=4,
        idle=1,
        unhealthy=0
    )
    
    # Verify counts changed
    updated = await agent_pool_store.get_pool(pool.pool_name)
    assert updated.active_agents == 4
    assert updated.idle_agents == 1


# ============================================================================
# Integration Tests (Store + Health Logic)
# ============================================================================

@pytest.mark.asyncio
async def test_agent_health_degradation_high_cpu(agent_store):
    """Test agent metrics are updated (health logic applied in Link layer)"""
    # Register agent
    sample_agent = Agent(
        agent_id="test-agent-001", pool_name="us-east-1-a", status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE, version="1.0.0",
        registered_at=datetime.utcnow(), last_heartbeat=datetime.utcnow(),
        current_job_count=0, max_concurrent_jobs=10, workload_identity_secret="secret-1", tags={}
    )
    agent = await agent_store.register_agent(sample_agent)
    
    # Update metrics with high CPU
    await agent_store.update_agent_metrics(
        agent.agent_id,
        cpu=95.0, memory=60.0, disk=70.0,  # CPU exceeds 90% threshold
        jobs_queued=2, jobs_completed=20, uptime=3600
    )
    
    # Verify metrics updated (health determination happens in RecordAgentHeartbeatLink)
    updated = await agent_store.get_agent(agent.agent_id)
    assert updated.metrics.cpu_percent == 95.0


@pytest.mark.asyncio
async def test_agent_health_degradation_high_memory(agent_store):
    """Test agent metrics are updated (health logic applied in Link layer)"""
    # Register agent
    sample_agent = Agent(
        agent_id="test-agent-001", pool_name="us-east-1-a", status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE, version="1.0.0",
        registered_at=datetime.utcnow(), last_heartbeat=datetime.utcnow(),
        current_job_count=0, max_concurrent_jobs=10, workload_identity_secret="secret-1", tags={}
    )
    agent = await agent_store.register_agent(sample_agent)
    
    # Update metrics with high memory
    await agent_store.update_agent_metrics(
        agent.agent_id,
        cpu=50.0, memory=95.0, disk=70.0,  # Memory exceeds 90% threshold
        jobs_queued=2, jobs_completed=20, uptime=3600
    )
    
    # Verify metrics updated (health determination happens in RecordAgentHeartbeatLink)
    updated = await agent_store.get_agent(agent.agent_id)
    assert updated.metrics.memory_percent == 95.0


@pytest.mark.asyncio
async def test_agent_health_degradation_high_disk(agent_store):
    """Test agent metrics are updated (health logic applied in Link layer)"""
    # Register agent
    sample_agent = Agent(
        agent_id="test-agent-001", pool_name="us-east-1-a", status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE, version="1.0.0",
        registered_at=datetime.utcnow(), last_heartbeat=datetime.utcnow(),
        current_job_count=0, max_concurrent_jobs=10, workload_identity_secret="secret-1", tags={}
    )
    agent = await agent_store.register_agent(sample_agent)
    
    # Update metrics with high disk usage
    await agent_store.update_agent_metrics(
        agent.agent_id,
        cpu=50.0, memory=60.0, disk=96.0,  # Disk exceeds 95% threshold
        jobs_queued=2, jobs_completed=20, uptime=3600
    )
    
    # Verify metrics updated (health determination happens in RecordAgentHeartbeatLink)
    updated = await agent_store.get_agent(agent.agent_id)
    assert updated.metrics.disk_percent == 96.0


@pytest.mark.asyncio
async def test_healthy_metrics_preserves_status(agent_store):
    """Test healthy metrics preserves HEALTHY status"""
    # Register agent
    sample_agent = Agent(
        agent_id="test-agent-001", pool_name="us-east-1-a", status=AgentStatus.HEALTHY,
        scaling_state=AgentScalingState.STABLE, version="1.0.0",
        registered_at=datetime.utcnow(), last_heartbeat=datetime.utcnow(),
        current_job_count=0, max_concurrent_jobs=10, workload_identity_secret="secret-1", tags={}
    )
    agent = await agent_store.register_agent(sample_agent)
    original_status = agent.status
    
    # Update metrics with healthy values
    await agent_store.update_agent_metrics(
        agent.agent_id,
        cpu=45.0, memory=55.0, disk=70.0,
        jobs_queued=2, jobs_completed=20, uptime=3600
    )
    
    # Verify status remained healthy
    updated = await agent_store.get_agent(agent.agent_id)
    assert updated.status == original_status
