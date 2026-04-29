#!/usr/bin/env bash
# Генерирует самоподписной keystore для HTTPS/WSS (локальная разработка).
# Файл попадает в backend/src/main/resources/keystore.p12 и игнорируется Git'ом.
#
# Запуск:  bash backend/scripts/generate-keystore.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESOURCES_DIR="$SCRIPT_DIR/../src/main/resources"
KEYSTORE_PATH="$RESOURCES_DIR/keystore.p12"
PASSWORD="${SSL_KEYSTORE_PASSWORD:-changeit}"

mkdir -p "$RESOURCES_DIR"

keytool -genkeypair \
  -alias usm \
  -keyalg RSA \
  -keysize 2048 \
  -validity 365 \
  -storetype PKCS12 \
  -keystore "$KEYSTORE_PATH" \
  -storepass "$PASSWORD" \
  -keypass "$PASSWORD" \
  -dname "CN=localhost, OU=USM, O=USM, L=Chisinau, S=MD, C=MD" \
  -ext "san=dns:localhost,ip:127.0.0.1"

echo "Keystore created at: $KEYSTORE_PATH"
echo "Password: $PASSWORD"
