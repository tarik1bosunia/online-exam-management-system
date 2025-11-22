# Build an Analytics API using FastAPI + Time-series Postgres

Own your data pipeline! 

Start by building an Analytics API service with Python, FastAPI, and Time-series Postgres with TimescaleDB



## Docker

- `docker build -t analytics-api -f Dockerfile.dev .`
- `docker run analytics-api `

becomes

- `docker compose up --watch`
- `docker compose down` or `docker compose down -v` (to remove volumes)
- `docker compose run app /bin/bash` or `docker compose run app python` 


## to use notebooks need to install these packages in venv
```bash
pip install notebook jupyter ipykernel
```







python -m venv venv
source venv/bin/activate
pip install pip --upgrade
pip install -r requirements.txt

### if in `main.py` in root directory
```
fastapi dev main.py
uvicorn main:app --reload
```
but if it is is ./src/main.py
```
uvicorn src.main:app --reload
```
docker pull python3.6.15
docker run -it python3.6.15

### up only the db
```bash
docker compose up -d db_service
```

### Stop ALL running containers

```bash
docker stop $(docker ps -q)
```

### docker clean 
```
docker compose down -v --remove-orphans
```

fastapi[standard]
```
annotated-doc==0.0.4
annotated-types==0.7.0
anyio==4.11.0
certifi==2025.11.12
click==8.3.0
dnspython==2.8.0
email-validator==2.3.0
fastapi==0.121.2
fastapi-cli==0.0.16
fastapi-cloud-cli==0.3.1
h11==0.16.0
httpcore==1.0.9
httptools==0.7.1
httpx==0.28.1
idna==3.11
Jinja2==3.1.6
markdown-it-py==4.0.0
MarkupSafe==3.0.3
mdurl==0.1.2
pydantic==2.12.4
pydantic_core==2.41.5
Pygments==2.19.2
python-dotenv==1.2.1
python-multipart==0.0.20
PyYAML==6.0.3
rich==14.2.0
rich-toolkit==0.15.1
rignore==0.7.6
sentry-sdk==2.44.0
shellingham==1.5.4
sniffio==1.3.1
starlette==0.49.3
typer==0.20.0
typing-inspection==0.4.2
typing_extensions==4.15.0
urllib3==2.5.0
uvicorn==0.38.0
uvloop==0.22.1
watchfiles==1.1.1
websockets==15.0.1
```