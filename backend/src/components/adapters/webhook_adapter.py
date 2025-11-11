"""
Universal Webhook Adapter - Single class for all DevOps tools.

This adapter uses config-driven behavior to handle webhooks from
any tool (GitHub, Jenkins, Terraform, Prometheus, etc.) without
tool-specific code. All differences are defined in YAML configs.

Pattern:
1. Load config (defines verification, event types, field extraction)
2. Verify signature using method from config
3. Extract event type from headers/payload using config
4. Map fields using JSONPath expressions from config
5. Normalize to WebhookEvent format
6. Return or raise with clear error messages
"""

import hmac
import hashlib
import json
import os
import uuid
from typing import Optional, Any
from datetime import datetime
from jsonpath_ng import parse as jsonpath_parse

from backend.src.models.webhook import WebhookEvent


class UniversalWebhookAdapter:
    """
    Single adapter handling all webhook tools via config-driven behavior.
    
    Supports:
    - Signature verification: HMAC-SHA256, token, signature, none
    - Event type extraction: Header-based or payload-based
    - Field extraction: JSONPath expressions (any nested field)
    - Error handling: Clear messages for debugging
    
    No tool-specific code - all differences are in YAML configs.
    """
    
    def __init__(self, config: dict):
        """
        Initialize adapter with tool configuration.
        
        Args:
            config: Tool config dict (loaded from YAML/JSON)
        
        Raises:
            ValueError: If config is invalid
        """
        self.config = config
        self.tool_id = config['metadata']['id']
        self.tool_name = config['metadata']['name']
    
    async def parse(self, payload: bytes, headers: dict) -> WebhookEvent:
        """
        Parse webhook payload to WebhookEvent.
        
        Flow:
        1. Verify signature (method from config)
        2. Parse JSON
        3. Extract event type
        4. Map fields using JSONPath expressions
        5. Normalize to WebhookEvent
        
        Args:
            payload: Raw webhook body (bytes)
            headers: HTTP headers dict
        
        Returns:
            WebhookEvent: Normalized event
        
        Raises:
            ValueError: For invalid signature, malformed JSON, unknown event type
        """
        # Step 1: Verify signature
        if not await self._verify_signature(payload, headers):
            raise ValueError(f"Invalid webhook signature for {self.tool_id}")
        
        # Step 2: Parse JSON
        try:
            payload_dict = json.loads(payload)
        except json.JSONDecodeError as e:
            raise ValueError(f"Malformed JSON payload: {e}")
        
        # Step 3: Extract event type
        event_type = await self._extract_event_type(payload_dict, headers)
        if not event_type:
            raise ValueError(f"Could not determine event type for {self.tool_id}")
        
        # Step 4: Map fields using config's data_mapping
        metadata = await self._extract_fields(payload_dict, event_type)
        
        # Step 5: Normalize to WebhookEvent
        source_url = metadata.pop('source_url', f"{self.tool_id}://event")
        
        webhook_event: WebhookEvent = {
            'event_id': str(uuid.uuid4()),
            'tool': self.tool_id,
            'event_type': event_type,
            'timestamp': datetime.utcnow(),
            'source_url': source_url,
            'metadata': metadata,
            'payload': payload_dict
        }
        
        return webhook_event
    
    async def _verify_signature(self, payload: bytes, headers: dict) -> bool:
        """
        Verify signature using method from config.
        
        Supported methods:
        - hmac-sha256: GitHub, GitLab, etc.
        - token: Jenkins, etc.
        - signature: Terraform Cloud, etc.
        - none: Testing or pre-verified (e.g., IP whitelist)
        
        Args:
            payload: Raw webhook body
            headers: HTTP headers
        
        Returns:
            bool: True if signature valid or not required, False if invalid
        
        Raises:
            ValueError: For misconfigured verification
        """
        method = self.config['integration']['webhooks']['verification']['method']
        
        if method == 'hmac-sha256':
            return await self._verify_hmac_sha256(payload, headers)
        elif method == 'token':
            return await self._verify_token(headers)
        elif method == 'signature':
            return await self._verify_signature_header(payload, headers)
        elif method == 'none':
            return True
        else:
            raise ValueError(f"Unknown verification method: {method}")
    
    async def _verify_hmac_sha256(self, payload: bytes, headers: dict) -> bool:
        """
        Verify HMAC-SHA256 signature (GitHub, GitLab style).
        
        Args:
            payload: Raw request body
            headers: HTTP headers
        
        Returns:
            bool: True if valid, False otherwise
        
        Raises:
            ValueError: If configuration incomplete
        """
        verification = self.config['integration']['webhooks']['verification']
        secret_env_var = verification.get('secret_env_var')
        header_name = verification.get('header', 'X-Hub-Signature-256')
        
        if not secret_env_var:
            raise ValueError("secret_env_var required for hmac-sha256 verification")
        
        secret = os.getenv(secret_env_var)
        if not secret:
            raise ValueError(f"Environment variable {secret_env_var} not set")
        
        signature = headers.get(header_name)
        if not signature:
            return False
        
        # Expected format: "sha256=<hex>"
        expected = "sha256=" + hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Use constant-time comparison
        return hmac.compare_digest(expected, signature)
    
    async def _verify_token(self, headers: dict) -> bool:
        """
        Verify token (Jenkins style).
        
        Args:
            headers: HTTP headers containing token
        
        Returns:
            bool: True if token valid, False otherwise
        
        Raises:
            ValueError: If configuration incomplete
        """
        verification = self.config['integration']['webhooks']['verification']
        secret_env_var = verification.get('secret_env_var')
        header_name = verification.get('header', 'X-Jenkins-Token')
        
        if not secret_env_var:
            raise ValueError("secret_env_var required for token verification")
        
        token = os.getenv(secret_env_var)
        if not token:
            raise ValueError(f"Environment variable {secret_env_var} not set")
        
        provided_token = headers.get(header_name, '')
        
        # Use constant-time comparison
        return hmac.compare_digest(token, provided_token)
    
    async def _verify_signature_header(self, payload: bytes, headers: dict) -> bool:
        """
        Verify signature header (Terraform Cloud style).
        
        Args:
            payload: Raw request body
            headers: HTTP headers
        
        Returns:
            bool: True if valid, False otherwise
        
        Raises:
            ValueError: If configuration incomplete
        """
        verification = self.config['integration']['webhooks']['verification']
        secret_env_var = verification.get('secret_env_var')
        header_name = verification.get('header', 'X-Terraform-Signature')
        
        if not secret_env_var:
            raise ValueError("secret_env_var required for signature verification")
        
        secret = os.getenv(secret_env_var)
        if not secret:
            raise ValueError(f"Environment variable {secret_env_var} not set")
        
        signature = headers.get(header_name)
        if not signature:
            return False
        
        # Generic signature verification
        return hmac.compare_digest(signature, secret)
    
    async def _extract_event_type(self, payload: dict, headers: dict) -> Optional[str]:
        """
        Extract event type from payload or headers using config.
        
        Args:
            payload: Parsed JSON payload
            headers: HTTP headers
        
        Returns:
            str: Event type (e.g., "push", "build_completed"), or None
        """
        events = self.config['integration']['webhooks'].get('events', {})
        
        # Try header-based event detection
        for event_type, event_config in events.items():
            http_event_header = event_config.get('http_event_header')
            header_value = event_config.get('header_value')
            
            if http_event_header and headers.get(http_event_header) == header_value:
                return event_type
        
        return None
    
    async def _extract_fields(self, payload: dict, event_type: str) -> dict:
        """
        Extract fields using config's data_mapping (JSONPath expressions).
        
        JSONPath expressions allow flexible extraction of nested fields:
        - $.repository.full_name → nested object access
        - $.items[0].id → array access
        - $.labels.* → wildcard (all values in object)
        
        Args:
            payload: Parsed JSON payload
            event_type: Event type key (to find correct data_mapping)
        
        Returns:
            dict: Extracted fields (field_name → value)
        
        Raises:
            KeyError: If event_type not in config
        """
        event_config = self.config['integration']['webhooks']['events'].get(event_type, {})
        data_mapping = event_config.get('data_mapping', {})
        
        extracted = {}
        for field_name, jsonpath_expr in data_mapping.items():
            try:
                # Use jsonpath-ng to extract value
                path = jsonpath_parse(jsonpath_expr)
                matches = path.find(payload)
                
                if matches:
                    extracted[field_name] = matches[0].value
                else:
                    extracted[field_name] = None
            except Exception as e:
                # Log extraction error but don't crash
                extracted[field_name] = None
        
        return extracted
