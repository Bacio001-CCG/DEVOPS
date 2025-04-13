# DEVOPS

## Service Status

![Auth Workflow](https://github.com/Bacio001-CCG/DEVOPS/actions/workflows/auth.yml/badge.svg)
![Clock Workflow](https://github.com/Bacio001-CCG/DEVOPS/actions/workflows/clock.yml/badge.svg)
![Gateway Workflow](https://github.com/Bacio001-CCG/DEVOPS/actions/workflows/gateway.yml/badge.svg)
![Mail Workflow](https://github.com/Bacio001-CCG/DEVOPS/actions/workflows/mail.yml/badge.svg)
![Read Workflow](https://github.com/Bacio001-CCG/DEVOPS/actions/workflows/read.yml/badge.svg)
![Register Workflow](https://github.com/Bacio001-CCG/DEVOPS/actions/workflows/register.yml/badge.svg)
![Score Workflow](https://github.com/Bacio001-CCG/DEVOPS/actions/workflows/score.yml/badge.svg)
![Target Workflow](https://github.com/Bacio001-CCG/DEVOPS/actions/workflows/target.yml/badge.svg)

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
