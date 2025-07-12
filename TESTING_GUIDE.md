# NexusCRM Testing Guide

## Testing Strategy

### Frontend Testing

#### 1. Unit Tests (Jest + React Testing Library)
```bash
# Install testing dependencies
cd frontend
yarn add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest
```

Create `frontend/jest.config.js`:
```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

#### 2. Component Tests Example
```typescript
// frontend/src/components/__tests__/DealCard.test.tsx
import { render, screen } from '@testing-library/react';
import DealCard from '../DealCard';

describe('DealCard', () => {
  it('renders deal information correctly', () => {
    const deal = {
      id: '1',
      name: 'Test Deal',
      value: 5000,
      clientName: 'Test Client'
    };
    
    render(<DealCard deal={deal} />);
    
    expect(screen.getByText('Test Deal')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
  });
});
```

#### 3. E2E Tests (Playwright)
```bash
# Install Playwright
yarn add -D @playwright/test
npx playwright install
```

Create `frontend/playwright.config.ts`:
```typescript
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
};

export default config;
```

### Backend Testing

#### 1. Unit Tests (Pytest)
```bash
# Install testing dependencies
cd backend
pip install pytest pytest-asyncio pytest-cov httpx
```

Create `backend/pytest.ini`:
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
```

#### 2. API Tests Example
```python
# backend/tests/test_tasks_api.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_task():
    response = client.post(
        "/routes/api/v1/tasks",
        json={
            "title": "Test Task",
            "description": "Test Description",
            "status": "To Do",
            "priority": "Medium"
        },
        headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Task"
    assert "id" in data

def test_list_tasks():
    response = client.get(
        "/routes/api/v1/tasks",
        headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

#### 3. Integration Tests
```python
# backend/tests/test_supabase_integration.py
import pytest
from supabase import create_client
import os

@pytest.fixture
def supabase_client():
    return create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_ANON_KEY")
    )

def test_contact_crud(supabase_client):
    # Create
    result = supabase_client.table("contacts").insert({
        "name": "Test Contact",
        "email": "test@example.com"
    }).execute()
    assert result.data
    
    contact_id = result.data[0]["id"]
    
    # Read
    result = supabase_client.table("contacts").select("*").eq("id", contact_id).execute()
    assert len(result.data) == 1
    
    # Update
    result = supabase_client.table("contacts").update({
        "phone": "+1234567890"
    }).eq("id", contact_id).execute()
    assert result.data[0]["phone"] == "+1234567890"
    
    # Delete
    result = supabase_client.table("contacts").delete().eq("id", contact_id).execute()
    assert result.data
```

## Test Data Management

### 1. Seed Data Script
```sql
-- backend/tests/seed_data.sql
-- Test users
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'user@test.com');

-- Test contacts
INSERT INTO public.contacts (id, name, email, program_type) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'John Doe', 'john@example.com', 'PRIME'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jane Smith', 'jane@example.com', 'LONGEVITY');

-- Test deals
INSERT INTO public.deals (name, value_amount, contact_id, deal_stage_id) VALUES
  ('Deal 1', 10000, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM deal_stages WHERE name = 'Proposal Sent')),
  ('Deal 2', 25000, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM deal_stages WHERE name = 'Negotiation'));
```

### 2. Test Environment Setup
```bash
# Create test environment file
cp .env.example .env.test

# Update with test database credentials
SUPABASE_URL=https://test-project.supabase.co
SUPABASE_ANON_KEY=test-anon-key
```

## CI/CD Testing

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && yarn install
      - run: cd frontend && yarn test
      - run: cd frontend && yarn test:e2e

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: cd backend && pip install -r requirements.txt
      - run: cd backend && pytest --cov=app tests/
```

## Performance Testing

### 1. Load Testing with Locust
```python
# backend/tests/locustfile.py
from locust import HttpUser, task, between

class CRMUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        self.client.headers['Authorization'] = 'Bearer test-token'
    
    @task(3)
    def view_pipeline(self):
        self.client.get("/routes/api/v1/analytics/pipeline")
    
    @task(2)
    def list_tasks(self):
        self.client.get("/routes/api/v1/tasks")
    
    @task(1)
    def create_task(self):
        self.client.post("/routes/api/v1/tasks", json={
            "title": f"Load test task",
            "status": "To Do"
        })
```

Run load tests:
```bash
locust -f tests/locustfile.py --host=http://localhost:8000
```

## Test Coverage Goals
- Unit Tests: 80% coverage
- Integration Tests: Critical paths covered
- E2E Tests: Happy paths + edge cases
- Performance: <2s page load, <200ms API response

## Testing Checklist
- [ ] All new features have tests
- [ ] Tests pass locally
- [ ] Tests pass in CI
- [ ] No console errors in browser
- [ ] API endpoints return correct status codes
- [ ] Error states are handled gracefully
- [ ] Performance benchmarks met
- [ ] Security tests pass (auth, permissions)
- [ ] Cross-browser testing complete