# Use official Python runtime
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies (needed for some python packages)
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*


# 1. Copy ALL project files (pyproject.toml AND the 'app' folder)
COPY . .

# 2. Install dependencies
# Now pip can see the 'app' folder, so it won't crash.
RUN pip install --no-cache-dir .

# --- CHANGED SECTION ENDS ---

# Expose port
EXPOSE 8000

# Run command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]