---
tags: [sprint/S-06, status/complete, priority/high]
sprint: S-06
weeks: 14–17
status: complete
updated: 2026-05-03
---

# S-06 — IIoT & Real-Time Integration

**Duration:** Weeks 14–17  
**Status:** ✅ Complete  
**Goal:** Connect welding machines to the ERP. Heat input compliance monitoring in real time.

---

## Tasks

### MQTT broker setup
- [x] Add Mosquitto to Docker Compose
- [ ] Configure TLS for MQTT connections (production hardening — S-08)
- [x] Topic schema: `machines/{machine_id}/telemetry`
- [x] Topic schema: `machines/{machine_id}/alerts`
- [x] Node.js MQTT subscriber service

### Telemetry ingestion
- [x] Subscribe to machine telemetry topics
- [x] Validate readings against WPS parameters (current, voltage, heat input)
- [x] Write validated readings to TimescaleDB `iiot_readings` hypertable
- [x] Compress older data (TimescaleDB compression policy: > 7 days)
  > Continuous aggregate iiot_1min_avg added for dashboard queries
- [x] Alert if heat input exceeds WPS max → emit event bus `wps.violation`
- [x] Alert if interpass temp > limit → emit `interpass.temp.exceeded`

### WebSocket real-time push
- [x] Socket.io server with room-based channels (per machine, per project)
- [x] Push live telemetry to connected browser clients every 2 seconds
- [x] Push event bus events to relevant department rooms
- [x] Reconnection handling: client re-subscribes on reconnect

### API endpoints
- [x] GET `/machines` — all machines with current status
- [x] GET `/machines/:id/telemetry` — last N readings
- [x] GET `/machines/:id/heat-log/:joint_id` — heat input for specific weld joint
- [x] GET `/iot/alerts` — active alerts across all machines

---

## Definition of done

- [ ] Mock MQTT publisher simulates 2 welding machines (for dev without hardware)
- [ ] Heat input violation alert fires within 3 seconds of out-of-range reading
- [ ] Browser dashboard updates live without page refresh
- [ ] TimescaleDB query for 30-day heat log returns in < 100ms

---

## Claude Code prompts

```bash
claude "Generate a Node.js MQTT subscriber that ingests welding machine telemetry, validates against WPS parameters, and writes to TimescaleDB"
claude "Generate a Socket.io server for NexaForge ERP with room-based channels for machine telemetry and event bus push"
claude "Write a mock MQTT publisher that simulates two welding machines sending telemetry at 1Hz for development testing"
```
