#!/usr/bin/env python3
"""
Webhook Config Validator CLI

Validates webhook tool configurations against JSON schema.
Helps users create and debug custom webhook integrations.

Usage:
  python validate-webhook-config.py <config_file>
  python validate-webhook-config.py --all                 # Validate all configs
  python validate-webhook-config.py --test <config_file>  # Test with sample payload
"""

import sys
import argparse
import json
import yaml
from pathlib import Path
import jsonschema

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path.parent))

from backend.src.services.webhook_config_loader import WebhookConfigLoader


def get_schema_path():
    """Get path to JSON schema"""
    return Path(__file__).parent.parent.parent / "schemas" / "webhook-config.schema.json"


def get_tools_dir():
    """Get path to tools directory"""
    return Path(__file__).parent.parent.parent / "config" / "webhooks" / "tools"


def get_private_tools_dir():
    """Get path to private tools directory"""
    return Path(__file__).parent.parent.parent / "config" / "webhooks" / "tools-private"


def load_schema():
    """Load JSON schema"""
    schema_path = get_schema_path()
    with open(schema_path, 'r') as f:
        return json.load(f)


def validate_file(file_path):
    """Validate single config file"""
    file_path = Path(file_path)
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    try:
        # Load config
        with open(file_path, 'r') as f:
            if file_path.suffix in ['.yaml', '.yml']:
                config = yaml.safe_load(f)
            else:
                config = json.load(f)
        
        # Load schema
        schema = load_schema()
        
        # Validate
        jsonschema.validate(instance=config, schema=schema)
        print(f"✅ Valid: {file_path}")
        print(f"   Tool ID: {config.get('metadata', {}).get('id')}")
        print(f"   Name: {config.get('metadata', {}).get('name')}")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {file_path}")
        print(f"   Error: {e}")
        return False
    except yaml.YAMLError as e:
        print(f"❌ Invalid YAML: {file_path}")
        print(f"   Error: {e}")
        return False
    except jsonschema.ValidationError as e:
        print(f"❌ Invalid config: {file_path}")
        print(f"   Error: {e.message}")
        print(f"   Path: {' → '.join(str(x) for x in e.path)}")
        return False
    except Exception as e:
        print(f"❌ Error validating {file_path}: {e}")
        return False


def validate_all():
    """Validate all configs in tools directories"""
    tools_dir = get_tools_dir()
    private_tools_dir = get_private_tools_dir()
    
    results = []
    
    # Public tools
    print(f"\nPublic tools ({tools_dir}):")
    print("─" * 60)
    for config_file in sorted(tools_dir.glob("*.yaml")) + sorted(tools_dir.glob("*.json")):
        if config_file.name != "template.yaml":  # Skip template
            results.append(validate_file(config_file))
    
    # Private tools
    if private_tools_dir.exists():
        print(f"\nPrivate tools ({private_tools_dir}):")
        print("─" * 60)
        for config_file in sorted(private_tools_dir.glob("*.yaml")) + sorted(private_tools_dir.glob("*.json")):
            results.append(validate_file(config_file))
    
    # Summary
    print("\n" + "=" * 60)
    passed = sum(1 for r in results if r)
    total = len(results)
    print(f"Summary: {passed}/{total} configs valid")
    
    if passed == total:
        print("✅ All configs valid!")
        return 0
    else:
        print(f"❌ {total - passed} config(s) invalid")
        return 1


def test_config(config_path):
    """Test config by attempting to load it"""
    print(f"\nTesting config: {config_path}")
    print("=" * 60)
    
    try:
        loader = WebhookConfigLoader(
            schema_path=str(get_schema_path()),
            tools_dir=str(get_tools_dir()),
            private_tools_dir=str(get_private_tools_dir())
        )
        
        tool_id = Path(config_path).stem
        config = loader.load_config(tool_id)
        
        print(f"✅ Config loaded successfully")
        print(f"\nMetadata:")
        print(f"  ID: {config['metadata']['id']}")
        print(f"  Name: {config['metadata']['name']}")
        print(f"  Category: {config['metadata']['category']}")
        
        print(f"\nWebhooks:")
        webhook_cfg = config.get('integration', {}).get('webhooks', {})
        print(f"  Enabled: {webhook_cfg.get('enabled')}")
        print(f"  Endpoint: {webhook_cfg.get('endpoint')}")
        print(f"  Verification: {webhook_cfg.get('verification', {}).get('method')}")
        
        events = webhook_cfg.get('events', {})
        print(f"  Events: {', '.join(events.keys())}")
        
        return 0
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1


def main():
    parser = argparse.ArgumentParser(
        description="Validate webhook tool configurations"
    )
    parser.add_argument(
        "config_file",
        nargs="?",
        help="Path to config file to validate"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Validate all configs in tools directories"
    )
    parser.add_argument(
        "--test",
        help="Test config by loading it"
    )
    
    args = parser.parse_args()
    
    if args.all:
        return validate_all()
    elif args.test:
        return test_config(args.test)
    elif args.config_file:
        return 0 if validate_file(args.config_file) else 1
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
