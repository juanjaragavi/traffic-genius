#!/usr/bin/env bash
# Downloads the MaxMind GeoLite2-Country database.
# Requires: MAXMIND_LICENSE_KEY environment variable.
# Usage: bash scripts/download-geoip.sh

set -euo pipefail

LICENSE_KEY="${MAXMIND_LICENSE_KEY:?Error: MAXMIND_LICENSE_KEY environment variable is not set}"
DEST="$(dirname "$0")/../data/GeoLite2-Country.mmdb"
TMPDIR="$(mktemp -d)"

echo "Downloading GeoLite2-Country database..."
curl -sL \
  "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=${LICENSE_KEY}&suffix=tar.gz" \
  -o "${TMPDIR}/geoip.tar.gz"

tar -xzf "${TMPDIR}/geoip.tar.gz" -C "${TMPDIR}"
MMDB="$(find "${TMPDIR}" -name "GeoLite2-Country.mmdb" | head -1)"
cp "${MMDB}" "${DEST}"
rm -rf "${TMPDIR}"

echo "GeoLite2-Country.mmdb saved to ${DEST}"
