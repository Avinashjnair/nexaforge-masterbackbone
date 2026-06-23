#!/bin/bash
# Generate self-signed CA + Mosquitto server certificate for MQTT TLS.
# Run once before first TLS deployment; re-run to rotate certs.
#
# Usage:  bash scripts/gen-mqtt-certs.sh [output-dir]
# Output: ca.key  ca.crt  server.key  server.crt  (in output-dir)

set -euo pipefail

OUTDIR="${1:-mosquitto/certs}"
DAYS=3650   # 10-year CA; 2-year server cert
CN="${MQTT_HOST:-localhost}"

mkdir -p "$OUTDIR"

echo "[1/4] Generating CA private key..."
openssl genrsa -out "$OUTDIR/ca.key" 4096

echo "[2/4] Generating self-signed CA certificate (${DAYS}-day)..."
openssl req -new -x509 -days "$DAYS" \
  -key "$OUTDIR/ca.key" \
  -out "$OUTDIR/ca.crt" \
  -subj "/C=AE/ST=Dubai/O=NexaForge/CN=NexaForge-MQTT-CA"

echo "[3/4] Generating server private key + CSR..."
openssl genrsa -out "$OUTDIR/server.key" 2048
openssl req -new \
  -key "$OUTDIR/server.key" \
  -out "$OUTDIR/server.csr" \
  -subj "/C=AE/ST=Dubai/O=NexaForge/CN=${CN}"

echo "[4/4] Signing server certificate with CA (730-day)..."
openssl x509 -req -days 730 \
  -in  "$OUTDIR/server.csr" \
  -CA  "$OUTDIR/ca.crt" \
  -CAkey "$OUTDIR/ca.key" \
  -CAcreateserial \
  -out "$OUTDIR/server.crt"

rm -f "$OUTDIR/server.csr" "$OUTDIR/ca.srl"

chmod 600 "$OUTDIR/ca.key" "$OUTDIR/server.key"
chmod 644 "$OUTDIR/ca.crt" "$OUTDIR/server.crt"

echo ""
echo "✓ Certificates written to $OUTDIR/"
echo "  CA cert:     $OUTDIR/ca.crt"
echo "  Server cert: $OUTDIR/server.crt"
echo "  Server key:  $OUTDIR/server.key"
echo ""
echo "Next steps:"
echo "  1. Copy ca.crt to API server → set MQTT_CA_CERT=/path/to/ca.crt"
echo "  2. Use mosquitto-tls.conf instead of mosquitto.conf in docker-compose"
echo "  3. Set MQTT_URL=mqtts://mosquitto:8883 in API env"
