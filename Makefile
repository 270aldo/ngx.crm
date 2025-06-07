install-backend:
	chmod +x backend/install.sh
	chmod +x backend/run.sh
	cd backend && ./install.sh

install-frontend:
	chmod +x frontend/install.sh
	chmod +x frontend/run.sh
	cd frontend && ./install.sh

install: install-backend install-frontend

run-backend:
	cd backend && ./run.sh

run-frontend:
        cd frontend && ./run.sh

lint-backend:
        cd backend && ruff .

format-backend:
        cd backend && black .

lint-frontend:
        cd frontend && yarn lint

format-frontend:
        cd frontend && yarn format

.DEFAULT_GOAL := install
