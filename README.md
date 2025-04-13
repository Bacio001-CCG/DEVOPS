# DEVOPS

## Service Status

| Service    | Status    | Port | Description            |
| ---------- | --------- | ---- | ---------------------- |
| gateway    | ✅ Active | 2000 | API Gateway            |
| auth       | ✅ Active | -    | Authentication Service |
| mail       | ✅ Active | -    | Mail Service           |
| clock      | ✅ Active | -    | Clock Service          |
| read       | ✅ Active | -    | Read Service           |
| register   | ✅ Active | -    | Registration Service   |
| score      | ✅ Active | -    | Scoring Service        |
| target     | ✅ Active | -    | Target Service         |
| RabbitMQ   | ✅ Active | 5672 | Message Broker         |
| Grafana    | ✅ Active | 2001 | Monitoring Dashboard   |
| Prometheus | ✅ Active | 9090 | Metrics Collection     |

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
