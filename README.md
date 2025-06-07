# Databutton app

This repository contains a FastAPI backend and a React + TypeScript frontend exported from Databutton.

## Stack

- React + TypeScript frontend using `yarn`
- FastAPI backend managed with `uv`

## Development setup

### Prerequisites

- **Python** 3.11 or newer
- **Node.js** 20+ with `corepack` enabled (for `yarn` v4)
- [`uv`](https://github.com/astral-sh/uv) installed globally

### Installation

Run the default `make` target to install both back‑end and front‑end dependencies:

```bash
make
```

This executes `backend/install.sh` and `frontend/install.sh`, creating a Python virtual environment and installing the node packages.

### Environment variables

The application expects several variables during development:

- **Frontend (`frontend/.env`)**
  - `DATABUTTON_PROJECT_ID` – unique ID for your Databutton project
  - `DATABUTTON_CUSTOM_DOMAIN` – optional domain when deploying
  - `DATABUTTON_EXTENSIONS` – JSON list of enabled extensions (defaults to `[{"name":"shadcn","version":"1"}]`)
- **Backend**
  - `DATABUTTON_EXTENSIONS` – same value as the frontend for extension configuration
  - `DATABUTTON_SERVICE_TYPE` – set to `prodx` in production to toggle production mode
  - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` – credentials used by the API, typically provided via secrets

Create or edit `frontend/.env` and export the backend variables in your shell (or add them to a `.env` file at the repository root).

## Development workflow

1. Start the FastAPI server:
   ```bash
   make run-backend
   ```
2. In another terminal, launch the Vite development server:
   ```bash
   make run-frontend
   ```
   The frontend runs on **http://localhost:5173** and proxies API calls to the backend on port **8000**.

Whenever dependencies change, rerun `make` to update the environment. Both servers support hot reloading, so changes will appear automatically during development.

## Gotchas

The backend listens on port `8000`. The frontend server runs on port `5173` and proxies API requests to the backend. Open <http://localhost:5173> to use the app in development.
