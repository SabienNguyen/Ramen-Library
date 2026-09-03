#!/usr/bin/env bash
# Nightly backup of the stack's durable data (sqld's database and Garage's
# metadata + block store) to a restic repository. Run from cron on the host,
# e.g.:
#   0 3 * * * /path/to/deploy/backup.sh >> /var/log/ramen-backup.log 2>&1
#
# Requires RESTIC_REPOSITORY and RESTIC_PASSWORD (plus any provider
# credentials the repository needs, e.g. AWS/B2/SFTP env vars) to be set in
# the environment or sourced from a file before this script runs.
#
# We do NOT stop any containers before backing up. sqld and Garage write
# their data via WAL, so the backup is crash-consistent (equivalent to what
# you'd get after a hard power-off) but not transaction-consistent — a
# backup could in theory capture a partially-applied write. That is an
# acceptable tradeoff for this scale; restic dedupes so nightly runs are
# cheap even if a lot of that data doesn't change.
#
# TODO: sqld has no built-in "hot snapshot" command as of writing. If/when
# it grows one (or an admin API endpoint for a consistent checkpoint), swap
# this for calling it before the backup instead of reading the live volume.

set -euo pipefail

: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY must be set}"
: "${RESTIC_PASSWORD:?RESTIC_PASSWORD must be set}"

RESTIC_IMAGE="${RESTIC_IMAGE:-restic/restic:latest}"

# docker compose prefixes named volumes with the compose project name
# (defaults to the directory name, "ramen-library" here). Override these if
# you run compose with a different -p/--project-name or COMPOSE_PROJECT_NAME.
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-ramen-library}"
SQLD_VOLUME="${SQLD_VOLUME:-${PROJECT_NAME}_sqld-data}"
GARAGE_META_VOLUME="${GARAGE_META_VOLUME:-${PROJECT_NAME}_garage-meta}"
GARAGE_DATA_VOLUME="${GARAGE_DATA_VOLUME:-${PROJECT_NAME}_garage-data}"

# Run restic against the named docker volumes without needing restic
# installed on the host: mount each read-only into a throwaway container
# alongside the restic binary, and forward the repository credentials.
restic_run() {
	docker run --rm \
		-e RESTIC_REPOSITORY \
		-e RESTIC_PASSWORD \
		-e AWS_ACCESS_KEY_ID \
		-e AWS_SECRET_ACCESS_KEY \
		-e AWS_DEFAULT_REGION \
		-v "${SQLD_VOLUME}:/src/sqld-data:ro" \
		-v "${GARAGE_META_VOLUME}:/src/garage-meta:ro" \
		-v "${GARAGE_DATA_VOLUME}:/src/garage-data:ro" \
		"$RESTIC_IMAGE" "$@"
}

echo "[backup] initializing repository (no-op if it already exists)"
restic_run snapshots >/dev/null 2>&1 || restic_run init

echo "[backup] backing up sqld-data, garage-meta, garage-data"
restic_run backup /src/sqld-data /src/garage-meta /src/garage-data \
	--tag ramen-library

echo "[backup] pruning old snapshots"
restic_run forget --keep-daily 14 --keep-weekly 8 --prune

echo "[backup] done"
