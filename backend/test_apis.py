#!/usr/bin/env python3
import main

try:
    app = main.create_app()
    print("✅ Backend with all APIs created successfully!")
    print("\nAvailable routes:")
    
    routes = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            for method in route.methods:
                if method != 'HEAD':
                    routes.append(f"{method:6} {route.path}")
    
    for route in sorted(routes):
        print(route)
        
    print(f"\nTotal API endpoints: {len(routes)}")
    
except Exception as e:
    print(f"❌ Error creating app: {e}")
    import traceback
    traceback.print_exc()