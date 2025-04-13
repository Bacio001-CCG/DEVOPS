# DEVOPS

## Service Status

![Auth Workflow](https://github.com/Bacio001-CCG/DEVOPS/actions/workflows/auth.yml/badge.svg)

## Commands

App Commands:

- npm run docker:dev
- npm run docker:prod

DB Commands:

- docker compose -f docker-compose.yml up --build

## Check Service Status

Check all services status:

```bash
docker compose ps
```

Check specific service status:

```bash
docker compose logs [service-name]
```

Monitoring dashboard:

http://localhost:2001
