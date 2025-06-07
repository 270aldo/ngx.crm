import os
import sys
import pathlib

# Ensure backend folder is on sys.path
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
os.chdir(pathlib.Path(__file__).resolve().parents[1])

import types
db_dummy = types.SimpleNamespace(secrets=types.SimpleNamespace(get=lambda k: None))
sys.modules['databutton'] = db_dummy
supabase_stub = types.ModuleType('supabase')
supabase_stub.create_client = lambda *a, **k: None
supabase_stub.Client = object
sys.modules['supabase'] = supabase_stub
import databutton_app.mw.auth_mw as auth_mw
auth_mw.get_authorized_user = lambda: None

from fastapi.testclient import TestClient
from main import app
import app.apis.tasks as tasks_module
import pytest

class DummyResponse:
    def __init__(self, data):
        self.data = data
        self.error = None

class DummyInsert:
    def __init__(self, table):
        self.table = table
    def execute(self):
        return DummyResponse(self.table.data)

class DummyTable:
    def __init__(self):
        self.inserted = []
        self.data = []
    def insert(self, data):
        self.inserted.append(data)
        return DummyInsert(self)
    def select(self, *args, **kwargs):
        return self
    def eq(self, *args, **kwargs):
        return self
    def limit(self, *args, **kwargs):
        return self
    def offset(self, *args, **kwargs):
        return self
    def order(self, *args, **kwargs):
        return self
    def execute(self):
        return DummyResponse(self.data)

class DummySupabase:
    def __init__(self, table):
        self._table = table
    def table(self, name):
        return self._table

@pytest.fixture
def client(monkeypatch):
    table = DummyTable()
    supabase = DummySupabase(table)
    monkeypatch.setattr(tasks_module, "supabase", supabase)
    client = TestClient(app)
    return client, table

def test_create_task(client):
    client_instance, table = client
    table.data = [{
        "id": "11111111-1111-1111-1111-111111111111",
        "title": "Test",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
        "status": "To Do",
        "priority": "Medium"
    }]
    resp = client_instance.post("/routes/api/v1/tasks", json={"title": "Test"})
    assert resp.status_code == 200
    assert table.inserted[0]["title"] == "Test"
    assert resp.json()["title"] == "Test"

def test_list_tasks(client):
    client_instance, table = client
    table.data = [{
        "id": "22222222-2222-2222-2222-222222222222",
        "title": "Task1",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
        "status": "To Do",
        "priority": "Medium"
    }]
    resp = client_instance.get("/routes/api/v1/tasks")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list) and len(data) == 1
    assert data[0]["title"] == "Task1"
