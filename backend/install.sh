#!/usr/bin/env bash

# Create a Python virtual environment using the Python interpreter
# available in the system. This ensures compatibility with Python
# versions 3.10 through 3.12.
python -m venv .venv

# Activate the virtual environment and install dependencies
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
