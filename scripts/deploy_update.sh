#!/usr/bin/env bash
# =============================================================================
# deploy_update.sh — Server-side deployment script for TrafficGenius
# =============================================================================
# Pulls the latest changes from the remote repository, rebuilds the Next.js
# application, and restarts the PM2 process on the production server.
#
# This script is intended to run ON THE SERVER (GCP Compute Engine VM)
# at the project root: /var/www/html/traffic-genius
#
# Usage:
#   sudo bash ./scripts/deploy_update.sh
#   sudo bash ./scripts/deploy_update.sh --skip-build   # Pull only, no rebuild
#   sudo bash ./scripts/deploy_update.sh --branch dev    # Pull from dev branch
#
# Prerequisites:
#   - Node.js and npm installed
#   - PM2 installed globally (npm i -g pm2)
#   - Git repository cloned at /var/www/html/traffic-genius
#   - Apache/Nginx reverse proxy configured for port 3080
#   - Environment variables in .env.local
# =============================================================================

set -euo pipefail
IFS=$'\n\t'

# =============================================================================
# Constants
# =============================================================================

readonly APP_NAME="traffic-genius"
readonly APP_PORT="3080"
readonly DEFAULT_BRANCH="main"
readonly REMOTE="origin"
readonly PM2_USER="www-data"
readonly PROJECT_DIR="/var/www/html/traffic-genius"
readonly COMMIT_MSG_FILE="lib/commit-message.txt"
readonly COMMIT_MSG_TIMEOUT=300

# =============================================================================
# Color helpers
# =============================================================================

readonly RED=$'\033[0;31m'
readonly GREEN=$'\033[0;32m'
readonly YELLOW=$'\033[1;33m'
readonly BLUE=$'\033[0;34m'
readonly CYAN=$'\033[0;36m'
readonly BOLD=$'\033[1m'
readonly NC=$'\033[0m'

info()    { printf '%s\n' "${BLUE}ℹ ${NC}${1}"; }
success() { printf '%s\n' "${GREEN}✅${NC} ${1}"; }
warn()    { printf '%s\n' "${YELLOW}⚠️  ${NC}${1}" >&2; }
error()   { printf '%s\n' "${RED}❌${NC} ${1}" >&2; }
step()    { printf '%s\n' "${CYAN}▸ ${BOLD}${1}${NC}"; }

# =============================================================================
# ERR trap
# =============================================================================

trap_err() {
    local exit_code
    exit_code=$?
    error "Deployment failed at line ${1} with exit code ${exit_code}"
    error "Failed command: ${BASH_COMMAND}"
    error ""
    error "The application may be in an inconsistent state."
    error "Check PM2 status:  sudo -u ${PM2_USER} pm2 status"
    error "Check PM2 logs:    sudo -u ${PM2_USER} pm2 logs ${APP_NAME} --lines 50"
    exit "${exit_code}"
}
trap 'trap_err ${LINENO}' ERR

# =============================================================================
# Argument parsing
# =============================================================================

BRANCH="$DEFAULT_BRANCH"
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --branch)
            if [[ -z "${2:-}" ]]; then
                error "--branch requires a branch name argument."
                exit 1
            fi
            BRANCH="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help|-h)
            cat <<EOF
${BOLD}TrafficGenius — Server Deployment Script${NC}

${BOLD}Usage:${NC} sudo bash ./scripts/deploy_update.sh [options]

${BOLD}Options:${NC}
  --branch <name>     Branch to pull from (default: main)
  --skip-build        Pull changes without rebuilding or restarting
  --help, -h          Print this usage information

${BOLD}Examples:${NC}
  sudo bash ./scripts/deploy_update.sh
  sudo bash ./scripts/deploy_update.sh --branch dev
  sudo bash ./scripts/deploy_update.sh --skip-build
EOF
            exit 0
            ;;
        *)
            error "Unknown option: ${1}"
            exit 1
            ;;
    esac
done

# =============================================================================
# Pre-flight checks
# =============================================================================

# Verify we are running with appropriate privileges
if [[ $EUID -ne 0 ]]; then
    error "This script must be run with sudo."
    error "Usage: sudo bash ./scripts/deploy_update.sh"
    exit 1
fi

# Navigate to project directory
if [[ -d "$PROJECT_DIR" ]]; then
    cd "$PROJECT_DIR"
else
    error "Project directory not found: ${PROJECT_DIR}"
    error "Is TrafficGenius deployed on this server?"
    exit 1
fi

# Verify git repository
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    error "Not a Git repository: ${PROJECT_DIR}"
    exit 1
fi

printf '\n%s\n\n' "${BOLD}${CYAN}--- TrafficGenius Deployment ---${NC}"
info "App:     ${APP_NAME}"
info "Branch:  ${BRANCH}"
info "Port:    ${APP_PORT}"
info "Dir:     ${PROJECT_DIR}"
printf '\n'

# =============================================================================
# Step 1 — Check for local changes and prepare commit message
# =============================================================================

step "[1/8] Checking for local changes..."

if [[ -n "$(git status --porcelain)" ]]; then
    info "Local changes detected — preparing commit."
    printf '\n'
    sudo -u "${PM2_USER}" git status --short
    printf '\n'

    # Create commit message file if it does not exist
    if [[ ! -f "${COMMIT_MSG_FILE}" ]]; then
        sudo -u "${PM2_USER}" mkdir -p "$(dirname "${COMMIT_MSG_FILE}")"
        sudo -u "${PM2_USER}" touch "${COMMIT_MSG_FILE}"
        info "Created ${COMMIT_MSG_FILE}"
    fi

    # If the file is empty, wait for the coding agent to populate it
    if [[ ! -s "${COMMIT_MSG_FILE}" ]]; then
        info "Waiting for coding agent to populate: ${BOLD}${COMMIT_MSG_FILE}${NC}"
        info "Write a commit message to that file to continue (timeout: ${COMMIT_MSG_TIMEOUT}s)..."

        elapsed=0
        while [[ ! -s "${COMMIT_MSG_FILE}" ]]; do
            sleep 2
            elapsed=$((elapsed + 2))
            if [[ ${elapsed} -ge ${COMMIT_MSG_TIMEOUT} ]]; then
                error "Timed out after ${COMMIT_MSG_TIMEOUT}s waiting for commit message."
                error "Populate ${COMMIT_MSG_FILE} and re-run the script."
                exit 1
            fi
        done
    fi

    info "Commit message received:"
    printf '  %s\n' "${CYAN}$(cat "${COMMIT_MSG_FILE}")${NC}"
    printf '\n'
    success "Commit message file is ready."
else
    info "Working tree is clean — nothing to commit."
fi

# =============================================================================
# Step 2 — Stage and commit local changes
# =============================================================================

step "[2/8] Staging and committing changes..."

if [[ -n "$(git status --porcelain)" ]]; then
    sudo -u "${PM2_USER}" git add -A
    sudo -u "${PM2_USER}" git commit -F "${COMMIT_MSG_FILE}"
    success "Changes committed."

    # Clean up the commit message file after successful commit
    sudo -u "${PM2_USER}" rm -f "${COMMIT_MSG_FILE}"
    info "Commit message file cleaned up."
else
    info "No changes to commit."
fi

# =============================================================================
# Step 3 — Push local commits to remote
# =============================================================================

step "[3/8] Pushing to ${REMOTE}/${BRANCH}..."
sudo -u "${PM2_USER}" git push "${REMOTE}" "${BRANCH}"
success "Push completed."

# =============================================================================
# Step 4 — Pull latest changes (merge any remote updates)
# =============================================================================

step "[4/8] Pulling latest changes from ${REMOTE}/${BRANCH}..."
sudo -u "${PM2_USER}" git pull "${REMOTE}" "${BRANCH}"
success "Pull completed."

# Show latest commit for verification
LATEST_COMMIT="$(git log --oneline -1)"
info "Latest commit: ${LATEST_COMMIT}"

# =============================================================================
# Step 5 — Install dependencies (if package-lock changed)
# =============================================================================

if [[ "$SKIP_BUILD" == true ]]; then
    warn "Skipping build steps (--skip-build)."
    printf '\n%s\n' "${GREEN}${BOLD}--- Pull Complete (build skipped) ---${NC}"
    exit 0
fi

step "[5/8] Installing dependencies..."

# Check if package-lock.json was updated in the pull
if git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q 'package-lock.json'; then
    info "package-lock.json changed — running full npm install."
    sudo -u "${PM2_USER}" npm ci --prefer-offline
else
    info "package-lock.json unchanged — running quick npm install."
    sudo -u "${PM2_USER}" npm install --prefer-offline
fi
success "Dependencies installed."

# =============================================================================
# Step 6 — Remove previous build and rebuild
# =============================================================================

step "[6/8] Building the application..."

# Remove previous build cache to ensure clean build
if [[ -d ".next" ]]; then
    sudo rm -rf .next
    info "Previous .next build directory removed."
fi

sudo -u "${PM2_USER}" npm run build
success "Application built successfully."

# =============================================================================
# Step 7 — Restart PM2 process
# =============================================================================

step "[7/8] Restarting PM2 process '${APP_NAME}'..."

# Check if the PM2 process exists
if sudo -u "${PM2_USER}" pm2 describe "${APP_NAME}" &>/dev/null; then
    sudo -u "${PM2_USER}" pm2 restart "${APP_NAME}"
    success "PM2 process '${APP_NAME}' restarted."
else
    warn "PM2 process '${APP_NAME}' not found — starting fresh."
    sudo -u "${PM2_USER}" pm2 start npm --name "${APP_NAME}" -- start
    success "PM2 process '${APP_NAME}' started."
fi

# =============================================================================
# Step 8 — Save PM2 process list and verify
# =============================================================================

step "[8/8] Saving PM2 state and verifying deployment..."

sudo -u "${PM2_USER}" pm2 save
success "PM2 process list saved."

# Brief pause to let the app initialize
sleep 3

# Verify the app is responding on port 3080
if curl -sf "http://localhost:${APP_PORT}" -o /dev/null --max-time 10; then
    success "Application is responding on port ${APP_PORT}."
else
    warn "Application not yet responding on port ${APP_PORT}."
    warn "Check logs: sudo -u ${PM2_USER} pm2 logs ${APP_NAME} --lines 50"
fi

# Show PM2 status
printf '\n'
sudo -u "${PM2_USER}" pm2 status

# =============================================================================
# Summary
# =============================================================================

printf '\n%s\n' "${GREEN}${BOLD}--- TrafficGenius Deployment Complete ---${NC}"
printf '  %s\n' "Branch:  ${BOLD}${BRANCH}${NC}"
printf '  %s\n' "Commit:  ${BOLD}${LATEST_COMMIT}${NC}"
printf '  %s\n' "Port:    ${BOLD}${APP_PORT}${NC}"
printf '  %s\n' "PM2:     ${BOLD}${APP_NAME}${NC}"
printf '\n'
info "Useful commands:"
info "  sudo -u ${PM2_USER} pm2 logs ${APP_NAME} --lines 50"
info "  sudo -u ${PM2_USER} pm2 status"
info "  sudo -u ${PM2_USER} pm2 restart ${APP_NAME}"
