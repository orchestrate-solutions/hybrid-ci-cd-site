"""
Stateless orchestration for NET ZERO risk relay architecture.

This module provides CodeUChain-based orchestration for polling user-owned
queues, applying routing rules, and sending decisions back without persisting
any sensitive data.
"""

from src.orchestration.router import RelayOrchestrationChain

__all__ = ["RelayOrchestrationChain"]
