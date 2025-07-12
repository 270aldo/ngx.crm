#!/usr/bin/env python3
import os
import pathlib
import json
from fastapi import APIRouter

# Set up the same environment as main.py
try:
    import dotenv
    dotenv.load_dotenv()
except ImportError:
    pass

def get_router_config():
    try:
        cfg = json.loads(open("routers.json").read())
    except:
        return False
    return cfg

def is_auth_disabled(router_config, name):
    if not router_config:
        return True
    return router_config["routers"][name]["disableAuth"]

# Test importing each API
router_config = get_router_config()
print("Router config:", router_config)

src_path = pathlib.Path(__file__).parent
apis_path = src_path / "app" / "apis"

api_names = [
    p.relative_to(apis_path).parent.as_posix()
    for p in apis_path.glob("*/__init__.py")
]

print(f"Found APIs: {api_names}")

api_module_prefix = "app.apis."

for name in api_names:
    print(f"\n=== Testing API: {name} ===")
    try:
        api_module = __import__(api_module_prefix + name, fromlist=[name])
        print(f"✅ Module imported successfully")
        
        api_router = getattr(api_module, "router", None)
        if isinstance(api_router, APIRouter):
            print(f"✅ Router found with {len(api_router.routes)} routes")
            for route in api_router.routes:
                if hasattr(route, 'methods') and hasattr(route, 'path'):
                    methods = [m for m in route.methods if m != 'HEAD']
                    if methods:
                        print(f"   {methods[0]} {route.path}")
        else:
            print(f"❌ No router found in module")
            
        auth_disabled = is_auth_disabled(router_config, name)
        print(f"Auth disabled: {auth_disabled}")
        
    except Exception as e:
        print(f"❌ Error importing {name}: {e}")
        import traceback
        traceback.print_exc()