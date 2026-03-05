#!/usr/bin/env bash
# =============================================================================
# sync-branches.sh — Synchronize main and dev branches for TrafficGenius
# =============================================================================
# Fetches the latest remote state, fast-forwards both branches, and merges
# main → dev so that the development branch stays up-to-date with production.
#
# Branching strategy: dev → main
#   - main: production-ready code
#   - dev:  active development
#
# The script always returns you to the branch you started on.
#
# Usage: ./scripts/sync-branches.sh [options]
#
# Options:
#   --direction <dir>   Merge direction: "main-to-dev" (default) or "dev-to-main"
#   --dry-run           Show what would happen without modifying any branches
#   --no-push           Merge locally but skip pushing to origin
#   --help, -h          Print usage information
#
# Examples:
#   ./scripts/sync-branches.sh                          # main → dev (default)
#   ./scripts/sync-branches.sh --direction dev-to-main  # dev → main (release)
#   ./scripts/sync-branches.sh --dry-run                # preview only
#   ./scripts/sync-branches.sh --no-push                # merge locally, push later
# =============================================================================

# --- Strict mode -----------------------------------------------------------
set -euo pipefail
IFS=$'\n\t'

# =============================================================================
# Constants
# =============================================================================

readonly MAIN_BRANCH="main"
readonly DEV_BRANCH="dev"
readonly REMOTE="origin"

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
# ERR trap — print failing command, exit code, and line number
# =============================================================================

trap_err() {
    local exit_code
    exit_code=$?
    error "Command failed at line ${1} with exit code ${exit_code}"
    error "Failed command: ${BASH_COMMAND}"

    # Attempt to return to the original branch on failure
    if [[ -n "${ORIGINAL_BRANCH:-}" ]]; then
        warn "Attempting to return to '${ORIGINAL_BRANCH}'..."
        git checkout "$ORIGINAL_BRANCH" 2>/dev/null || true
    fi

    exit "${exit_code}"
}
trap 'trap_err ${LINENO}' ERR

# =============================================================================
# Usage
# =============================================================================

usage() {
    cat <<EOF
${BOLD}TrafficGenius — Branch Synchronization${NC}

${BOLD}Usage:${NC} ./scripts/sync-branches.sh [options]

${BOLD}Options:${NC}
  --direction <dir>   Merge direction (default: main-to-dev)
                        main-to-dev  — merge main into dev (keep dev up-to-date)
                        dev-to-main  — merge dev into main (release to production)
  --dry-run           Preview what would happen without modifying branches
  --no-push           Merge locally but do not push to origin
  --help, -h          Print this usage information

${BOLD}Examples:${NC}
  ./scripts/sync-branches.sh                          # default: main → dev
  ./scripts/sync-branches.sh --direction dev-to-main  # release: dev → main
  ./scripts/sync-branches.sh --dry-run                # preview only
  ./scripts/sync-branches.sh --no-push                # local merge, push later
EOF
}

# =============================================================================
# Pre-flight checks
# =============================================================================

if ! command -v git &>/dev/null; then
    error "git is not installed or not in PATH."
    exit 1
fi

if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    error "Not inside a Git repository."
    exit 1
fi

cd "$(git rev-parse --show-toplevel)"

# =============================================================================
# Argument parsing
# =============================================================================

DIRECTION="main-to-dev"
DRY_RUN=false
NO_PUSH=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --direction)
            if [[ -z "${2:-}" ]]; then
                error "--direction requires an argument: main-to-dev or dev-to-main"
                exit 1
            fi
            if [[ "$2" != "main-to-dev" && "$2" != "dev-to-main" ]]; then
                error "Invalid direction: '${2}'. Use 'main-to-dev' or 'dev-to-main'."
                exit 1
            fi
            DIRECTION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --no-push)
            NO_PUSH=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            error "Unknown option: ${1}"
            usage >&2
            exit 1
            ;;
    esac
done

# Resolve source and target based on direction
if [[ "$DIRECTION" == "main-to-dev" ]]; then
    SOURCE_BRANCH="$MAIN_BRANCH"
    TARGET_BRANCH="$DEV_BRANCH"
else
    SOURCE_BRANCH="$DEV_BRANCH"
    TARGET_BRANCH="$MAIN_BRANCH"
fi

# =============================================================================
# Record starting branch (to return to it at the end)
# =============================================================================

ORIGINAL_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

printf '\n%s\n\n' "${BOLD}${CYAN}--- TrafficGenius Branch Sync ---${NC}"
info "Direction:  ${BOLD}${SOURCE_BRANCH} → ${TARGET_BRANCH}${NC}"
info "Starting:   ${BOLD}${ORIGINAL_BRANCH}${NC}"
if [[ "$DRY_RUN" == true ]]; then
    warn "Dry-run mode — no branches will be modified."
fi
if [[ "$NO_PUSH" == true ]]; then
    warn "No-push mode — changes will not be pushed to ${REMOTE}."
fi
printf '\n'

# =============================================================================
# Step 1 — Ensure working tree is clean
# =============================================================================

step "[1/5] Checking working tree..."

if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    error "Working directory is not clean."
    error "Commit or stash your changes before synchronizing branches."
    error ""
    error "Quick options:"
    error "  git stash                    # stash changes temporarily"
    error "  git add -A && git commit     # commit everything"
    exit 1
fi

success "Working tree is clean."

# =============================================================================
# Step 2 — Fetch latest from remote
# =============================================================================

step "[2/5] Fetching latest from ${REMOTE}..."

if [[ "$DRY_RUN" == true ]]; then
    info "Would run: git fetch ${REMOTE}"
else
    git fetch "$REMOTE"
    success "Fetch complete."
fi

# =============================================================================
# Step 3 — Update source branch
# =============================================================================

step "[3/5] Updating ${SOURCE_BRANCH} branch..."

if [[ "$DRY_RUN" == true ]]; then
    info "Would run: git checkout ${SOURCE_BRANCH} && git pull ${REMOTE} ${SOURCE_BRANCH}"
else
    git checkout "$SOURCE_BRANCH"
    git pull "$REMOTE" "$SOURCE_BRANCH"

    SOURCE_HEAD="$(git log --oneline -1)"
    success "${SOURCE_BRANCH} updated — ${SOURCE_HEAD}"
fi

# =============================================================================
# Step 4 — Merge source into target
# =============================================================================

step "[4/5] Merging ${SOURCE_BRANCH} → ${TARGET_BRANCH}..."

if [[ "$DRY_RUN" == true ]]; then
    info "Would run: git checkout ${TARGET_BRANCH}"
    info "Would run: git merge ${SOURCE_BRANCH} --no-edit"

    # Show what commits would be merged
    if git rev-parse --verify "${REMOTE}/${TARGET_BRANCH}" &>/dev/null && \
       git rev-parse --verify "${REMOTE}/${SOURCE_BRANCH}" &>/dev/null; then
        AHEAD_COUNT="$(git rev-list --count "${REMOTE}/${TARGET_BRANCH}..${REMOTE}/${SOURCE_BRANCH}" 2>/dev/null || echo "0")"
        if [[ "$AHEAD_COUNT" -gt 0 ]]; then
            info "${AHEAD_COUNT} commit(s) would be merged:"
            git log --oneline "${REMOTE}/${TARGET_BRANCH}..${REMOTE}/${SOURCE_BRANCH}" | head -10
            if [[ "$AHEAD_COUNT" -gt 10 ]]; then
                info "... and $((AHEAD_COUNT - 10)) more"
            fi
        else
            info "Branches are already in sync — nothing to merge."
        fi
    fi
else
    git checkout "$TARGET_BRANCH"
    git pull "$REMOTE" "$TARGET_BRANCH"

    # Attempt the merge
    if ! git merge "$SOURCE_BRANCH" --no-edit; then
        error "Merge conflicts detected while merging ${SOURCE_BRANCH} into ${TARGET_BRANCH}."
        error ""
        error "To resolve:"
        error "  1. Fix conflict markers in the files listed above"
        error "  2. Stage resolved files:  git add <file>"
        error "  3. Complete the merge:    git commit"
        error ""
        error "To abort and return to previous state:"
        error "  git merge --abort"
        error "  git checkout ${ORIGINAL_BRANCH}"
        exit 1
    fi

    TARGET_HEAD="$(git log --oneline -1)"
    success "Merge complete — ${TARGET_HEAD}"
fi

# =============================================================================
# Step 5 — Push and return to original branch
# =============================================================================

step "[5/5] Pushing and cleaning up..."

if [[ "$DRY_RUN" == true ]]; then
    if [[ "$NO_PUSH" == false ]]; then
        info "Would run: git push ${REMOTE} ${TARGET_BRANCH}"
    fi
    info "Would run: git checkout ${ORIGINAL_BRANCH}"
else
    # Push the merged target branch
    if [[ "$NO_PUSH" == false ]]; then
        git push "$REMOTE" "$TARGET_BRANCH"
        success "Pushed ${TARGET_BRANCH} to ${REMOTE}."
    else
        info "Skipping push (--no-push). Push manually: git push ${REMOTE} ${TARGET_BRANCH}"
    fi

    # Return to the branch the user was on
    git checkout "$ORIGINAL_BRANCH"
    success "Returned to '${ORIGINAL_BRANCH}'."
fi

# =============================================================================
# Summary
# =============================================================================

printf '\n%s\n' "${GREEN}${BOLD}🎉 Branch sync complete!${NC}"
printf '  %s\n' "Direction:  ${BOLD}${SOURCE_BRANCH} → ${TARGET_BRANCH}${NC}"
if [[ "$DRY_RUN" == true ]]; then
    printf '  %s\n' "Mode:       ${YELLOW}dry-run (no changes made)${NC}"
elif [[ "$NO_PUSH" == true ]]; then
    printf '  %s\n' "Push:       ${YELLOW}skipped (local only)${NC}"
else
    printf '  %s\n' "Push:       ${GREEN}pushed to ${REMOTE}${NC}"
fi
printf '  %s\n' "Branch:     ${BOLD}${ORIGINAL_BRANCH}${NC} (current)"

if [[ "$DIRECTION" == "dev-to-main" && "$DRY_RUN" == false ]]; then
    printf '\n%s\n' "${BLUE}ℹ ${NC}Release merged into main. Don't forget to deploy:"
    printf '  %s\n' "sudo bash ./scripts/deploy_update.sh"
fi
