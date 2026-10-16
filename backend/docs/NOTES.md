# Technical Decisions & Rationale Ledger

## Block 1: REST Foundation & Data Model
- **Choice:** Spring Boot + PostgreSQL
- **Why:** Relational consistency for ticket lifecycle, JPA/Hibernate support, reliable ACID compliance.
- **Tradeoff:** Rigid schema migrations compared to document databases like MongoDB.

## Block 2: Authentication
- **Choice:** JWT (JSON Web Tokens) with BCrypt
- **Why:** Stateless authentication allows microservices (MCP server, Agent API) to authorize requests easily.
- **Tradeoff:** Revocation is harder compared to stateful server sessions without a blacklist store.
