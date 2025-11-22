# 📌 PostgreSQL Database Inspection — Cheat Sheet

Quick commands to view and debug your database values for FastAPI + SQLModel + Docker.

---

## 🔥 1. **Inspect DB Inside Docker**

### Step: Enter PostgreSQL container

```
docker compose exec db_service sh
```

### Step: Open PostgreSQL client

```
psql -U time-user -d timescaledb
```

### List all tables

```
\dt
```

### View data in table (SQLModel table → `eventmodel`)

```
SELECT * FROM eventmodel;
```

### Pretty formatting

```
\x on
SELECT * FROM eventmodel;
```

---

## 🏠 2. **Local PostgreSQL (No Docker)**

```
psql postgresql://time-user:time-pw@localhost:5432/timescaledb
```

Same commands work:

```
\dt
SELECT * FROM eventmodel ORDER BY id DESC;
```

---

## 🖥️ 3. **GUI Tools (Recommended)**

### DBeaver / PgAdmin settings

```
Host: localhost
Port: 5432
Database: timescaledb
User: time-user
Password: time-pw
```

Browse tables visually.

---

## 🐍 4. **Python Quick Check**

```python
from sqlmodel import select
from api.db.session import get_session
from models import EventModel

with next(get_session()) as session:
    rows = session.exec(select(EventModel)).all()
    print(rows)
```

Run:

```
python check_db.py
```

---

## 🧪 5. **Debug query for your update issue**

```
SELECT id, page, description FROM eventmodel ORDER BY id DESC;
```

Checks if the updated `description` is REALLY stored.

---

## 📝 Table Name Reminder

`class EventModel(SQLModel, table=True)` → becomes table:

```
eventmodel
```

(all lowercase, no plural)

---

**Use this cheat sheet anytime you want to view or debug your DB values.**
