# Hawkeyes

A ClickHouse SQL viewer with an AI assistant powered by Tambo. Built for querying EBMUD water utility data.

## Features

- SQL editor with syntax highlighting
- Query results viewer with table/JSON views
- AI assistant for natural language queries
- ClickHouse database browser

## Getting Started

This project uses Docker Compose for development. It includes:
- **Next.js web app** (port 7900) with hot reloading
- **ClickHouse database** (port 7800)

### Prerequisites

- Docker and Docker Compose installed

### Running the App

1. Clone the repository:
```bash
git clone https://github.com/sutroconsultants/hawkeyes.git
cd hawkeyes
```

2. Create a `.env.local` file with your API keys:
```bash
# Tambo AI
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key

# ClickHouse (defaults work with docker-compose)
CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=clickhouse
CLICKHOUSE_DATABASE=hawkeyes
```

3. Start the services:
```bash
docker-compose up -d
```

4. Open [http://localhost:7900](http://localhost:7900) in your browser.

### Hot Reloading

The development server supports hot reloading - any changes you make to the code will automatically reflect in the browser without needing to restart the container.

### Useful Commands

```bash
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f web

# Restart web service
docker-compose restart web

# Stop all services
docker-compose down

# Rebuild after package.json changes
docker-compose down && docker-compose up -d --build
```

### Seeding the Database

To seed the ClickHouse database with sample EBMUD data:
```bash
curl -X POST http://localhost:7900/api/clickhouse/seed
```

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework
- [Tambo](https://tambo.ai/) - AI assistant SDK
- [ClickHouse](https://clickhouse.com/) - Analytics database
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
