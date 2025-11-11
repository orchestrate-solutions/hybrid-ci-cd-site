"""
Webhook Config Loader - Load, validate, and manage tool configurations.

This loader:
1. Loads YAML/JSON configs from public and private directories
2. Validates against JSON schema
3. Lists available tools
4. Provides clear error messages for debugging

Supports:
- Public configs in config/webhooks/tools/ (in git)
- Private configs in config/webhooks/tools-private/ (gitignored)
- YAML as primary format, JSON as fallback
- Schema validation with jsonschema
"""

import json
import yaml
import jsonschema
from pathlib import Path
from typing import Dict, List, Optional, Any


class WebhookConfigLoader:
    """Load, validate, and manage webhook tool configurations."""
    
    def __init__(self, schema_path: str, tools_dir: str, private_tools_dir: str):
        """
        Initialize config loader.
        
        Args:
            schema_path: Path to webhook-config.schema.json
            tools_dir: Path to public tools configs directory
            private_tools_dir: Path to private tools configs directory (gitignored)
        
        Raises:
            FileNotFoundError: If schema file doesn't exist
            json.JSONDecodeError: If schema is invalid JSON
        """
        self.schema_path = Path(schema_path)
        self.tools_dir = Path(tools_dir)
        self.private_tools_dir = Path(private_tools_dir)
        
        # Ensure directories exist
        self.tools_dir.mkdir(parents=True, exist_ok=True)
        self.private_tools_dir.mkdir(parents=True, exist_ok=True)
        
        # Load schema
        self.schema = self._load_schema()
    
    def _load_schema(self) -> dict:
        """
        Load JSON schema for validation.
        
        Returns:
            dict: JSON schema
        
        Raises:
            FileNotFoundError: If schema file not found
            json.JSONDecodeError: If schema is invalid
        """
        if not self.schema_path.exists():
            raise FileNotFoundError(f"Schema not found: {self.schema_path}")
        
        with open(self.schema_path, 'r') as f:
            return json.load(f)
    
    async def load_config(self, tool_id: str) -> Dict[str, Any]:
        """
        Load tool config from YAML/JSON.
        
        Checks in order:
        1. Public: config/webhooks/tools/{tool_id}.yaml
        2. Public: config/webhooks/tools/{tool_id}.json
        3. Private: config/webhooks/tools-private/{tool_id}.yaml
        4. Private: config/webhooks/tools-private/{tool_id}.json
        
        Args:
            tool_id: Tool identifier (lowercase alphanumeric + hyphens)
        
        Returns:
            dict: Tool configuration
        
        Raises:
            FileNotFoundError: If config not found
            ValueError: If config is invalid
        """
        # Try public directory first
        config_file = self.tools_dir / f"{tool_id}.yaml"
        if not config_file.exists():
            config_file = self.tools_dir / f"{tool_id}.json"
        
        # Try private directory
        if not config_file.exists():
            config_file = self.private_tools_dir / f"{tool_id}.yaml"
        if not config_file.exists():
            config_file = self.private_tools_dir / f"{tool_id}.json"
        
        if not config_file.exists():
            raise FileNotFoundError(
                f"Tool config not found: {tool_id}\n"
                f"Searched in:\n"
                f"  {self.tools_dir}\n"
                f"  {self.private_tools_dir}"
            )
        
        # Load file
        with open(config_file, 'r') as f:
            if str(config_file).endswith('.yaml'):
                config = yaml.safe_load(f)
            else:
                config = json.load(f)
        
        # Validate against schema
        self.validate_config(config)
        
        return config
    
    def validate_config(self, config: dict) -> None:
        """
        Validate config against JSON schema.
        
        Args:
            config: Configuration dict to validate
        
        Raises:
            ValueError: If config is invalid (with detailed error message)
        """
        try:
            jsonschema.validate(instance=config, schema=self.schema)
        except jsonschema.ValidationError as e:
            # Provide detailed error message
            path = " → ".join(str(p) for p in e.absolute_path) if e.absolute_path else "(root)"
            raise ValueError(
                f"Invalid webhook config at {path}: {e.message}\n"
                f"Expected: {e.validator_value if hasattr(e, 'validator_value') else 'see schema'}"
            )
    
    async def list_tools(self) -> List[str]:
        """
        List all available tool configurations.
        
        Returns:
            list: Sorted list of tool IDs
        """
        tools = set()
        
        # Public tools
        if self.tools_dir.exists():
            for file in self.tools_dir.glob("*.yaml"):
                tools.add(file.stem)
            for file in self.tools_dir.glob("*.json"):
                tools.add(file.stem)
        
        # Private tools
        if self.private_tools_dir.exists():
            for file in self.private_tools_dir.glob("*.yaml"):
                tools.add(file.stem)
            for file in self.private_tools_dir.glob("*.json"):
                tools.add(file.stem)
        
        return sorted(list(tools))
    
    async def validate_config_file(self, file_path: str) -> dict:
        """
        Validate a config file at given path.
        
        Useful for users validating their custom tool configs before deployment.
        
        Args:
            file_path: Path to config file to validate
        
        Returns:
            dict: Result with 'valid': True if valid
        
        Raises:
            FileNotFoundError: If file not found
            ValueError: If config is invalid
            yaml.YAMLError: If YAML is malformed
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"Config file not found: {file_path}")
        
        # Load file
        with open(file_path, 'r') as f:
            if str(file_path).endswith('.yaml'):
                config = yaml.safe_load(f)
            else:
                config = json.load(f)
        
        # Validate
        self.validate_config(config)
        
        return {"valid": True, "path": str(file_path)}
