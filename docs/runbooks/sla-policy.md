# SLA & Escalation Policy Guidelines

## SLA Targets by Priority
- **CRITICAL**: SLA resolution target within 2 hours. Requires immediate escalation if unassigned after 15 minutes.
- **HIGH**: SLA resolution target within 8 hours. At-risk threshold is 2 hours before deadline.
- **MEDIUM**: SLA resolution target within 24 hours. At-risk threshold is 4 hours before deadline.
- **LOW**: SLA resolution target within 72 hours.

## Escalation Rules
1. Any ticket marked as BREACHED must be automatically escalated to the Operations Manager (`ops-manager@company.com`).
2. CRITICAL tickets that remain OPEN for over 1 hour must be reassigned to the Senior On-Call Engineer.
3. Status changes to CLOSED require explicit customer or reporter confirmation.