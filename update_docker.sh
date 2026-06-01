#!/bin/bash
sudo docker cp backend/schemas.py amvet-backend:/app/schemas.py
sudo docker cp backend/models.py amvet-backend:/app/models.py
sudo docker cp backend/routers/recetas.py amvet-backend:/app/routers/recetas.py
sudo docker cp backend/routers/examenes.py amvet-backend:/app/routers/examenes.py
sudo docker cp backend/routers/citas.py amvet-backend:/app/routers/citas.py
sudo docker compose restart backend
