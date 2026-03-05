#!/usr/bin/env bash
# =============================================================================
# git-workflow.sh — Automated Git workflow for TrafficGenius
# =============================================================================
# Stages, commits, validates (TypeScript + ESLint + Prettier), and pushes local
# changes following Conventional Commits and pre-push quality gates.
#
# Branching strategy: dev → main
# Protected branches: main, production (force-push blocked)
#
# Usage: ./scripts/git-workflow.sh [options] "<commit message>"
#
# Options:
#   --branch <name>     Target branch (defaults to current branch)
#   --force             Enable force-push (non-protected branches only)
#   --verify-build      Run `next build` before pushing
#   --skip-format       Skip Prettier formatting check
#   --dry-run           Execute all steps except the final push
#   --help, -h          Print usage information
#
# Examples:
#   ./scripts/git-workflow.sh "feat(dashboard): add IVT trend chart"
#   ./scripts/git-workflow.sh --verify-build "fix(api): handle null Cloud Armor response"
#   ./scripts/git-workflow.sh --dry-run "chore(deps): update @google-cloud/bigquery"
#   ./scripts/git-workflow.sh --branch dev "feat(cloud-armor): rule toggle endpoint"
# =============================================================================

# --- Strict mode -----------------------------------------------------------
# -e: exit on error | -u: error on unset vars | -o pipefail: pipe exit codes
set -euo pipefail
IFS=$'\n\t'

# =============================================================================
# Constants
# =============================================================================

# Branches that reject force-push under all circumstances.
# TrafficGenius uses a two-tier strategy: dev → main
readonly PROTECTED_BRANCHES=("main" "production")

# Default remote name
readonly REMOTE="origin"

# Conventional Commits regex: type(optional-scope)[optional !]: description
# Types: feat fix chore docs style refactor perf test build ci revert
readonly CONVENTIONAL_COMMIT_REGEX='^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)(\([a-zA-Z0-9_./-]+\))?!?: .+'

# Path to the commit message file (relative to repo root)
readonly COMMIT_MESSAGE_FILE="lib/commit-message.txt"

# =============================================================================
# Color helpers
# =============================================================================

readonly RED=$'\033[0;31m'
readonly GREEN=$'\033[0;32m'
readonly YELLOW=$'\033[1;33m'
readonly BLUE=$'\033[0;34m'
readonly CYAN=$'\033[0;36m'
readonly BOLD=$'\033[1m'
readonly NC=$'\033[0m'  # No Color / reset

# --- Output functions --------------------------------------------------------
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
    exit "${exit_code}"
}
trap 'trap_err ${LINENO}' ERR

# =============================================================================
# Usage
# =============================================================================

usage() {
    cat <<EOF
${BOLD}TrafficGenius — Git Workflow${NC}

${BOLD}Usage:${NC} ./scripts/git-workflow.sh [options] "<commit message>"

${BOLD}Options:${NC}
  --branch <name>     Target branch (defaults to current branch)
  --force             Enable force-push (non-protected branches only; uses --force-with-lease)
  --verify-build      Run next build before pushing
  --skip-format       Skip Prettier formatting check
  --dry-run           Execute all steps except the final git push
  --help, -h          Print this usage information

${BOLD}Branching strategy:${NC}
  dev → main
  Protected branches (no force-push): main, production

${BOLD}Commit message format (Conventional Commits):${NC}
  type(scope): description
  Types: feat, fix, chore, docs, style, refactor, perf, test, build, ci, revert
  Scope is optional. Append ! before : for breaking changes.

${BOLD}Examples:${NC}
  ./scripts/git-workflow.sh "feat(dashboard): add IVT trend chart"
  ./scripts/git-workflow.sh --verify-build "fix(api): handle null Cloud Armor response"
  ./scripts/git-workflow.sh --dry-run "chore(deps): update @google-cloud/bigquery"
  ./scripts/git-workflow.sh --branch dev --force "refactor(gcp): restructure BigQuery queries"
EOF
}

# =============================================================================
# Pre-flight checks
# =============================================================================

# Verify git is available
if ! command -v git &>/dev/null; then
    error "git is not installed or not in PATH."
    exit 1
fi

# Verify we are inside a Git repository
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    error "Not inside a Git repository."
    exit 1
fi

# Navigate to the repository root so npx/tsc/eslint commands resolve correctly
cd "$(git rev-parse --show-toplevel)"

# =============================================================================
# Argument parsing
# =============================================================================

TARGET_BRANCH=""
FORCE_PUSH=false
VERIFY_BUILD=false
SKIP_FORMAT=false
DRY_RUN=false
COMMIT_MESSAGE=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --branch)
            if [[ -z "${2:-}" ]]; then
                error "--branch requires a branch name argument."
                exit 1
            fi
            TARGET_BRANCH="$2"
            shift 2
            ;;
        --force)
            FORCE_PUSH=true
            shift
            ;;
        --verify-build)
            VERIFY_BUILD=true
            shift
            ;;
        --skip-format)
            SKIP_FORMAT=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        -*)
            error "Unknown option: ${1}"
            usage >&2
            exit 1
            ;;
        *)
            # Positional argument → commit message
            if [[ -n "$COMMIT_MESSAGE" ]]; then
                error "Multiple commit messages provided. Wrap the full message in quotes."
                exit 1
            fi
            COMMIT_MESSAGE="$1"
            shift
            ;;
    esac
done

# =============================================================================
# Resolve working branch
# =============================================================================

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ -n "$TARGET_BRANCH" ]]; then
    if [[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]]; then
        error "Currently on '${CURRENT_BRANCH}' but --branch '${TARGET_BRANCH}' was specified."
        error "Checkout the target branch first:  git checkout ${TARGET_BRANCH}"
        exit 1
    fi
    BRANCH="$TARGET_BRANCH"
else
    BRANCH="$CURRENT_BRANCH"
fi

info "Working on branch: ${BOLD}${BRANCH}${NC}"

# =============================================================================
# Helper: check if a branch is protected
# =============================================================================

is_protected_branch() {
    local branch="$1"
    local protected
    for protected in "${PROTECTED_BRANCHES[@]}"; do
        if [[ "$branch" == "$protected" ]]; then
            return 0
        fi
    done
    return 1
}

# =============================================================================
# Step 1 — Validate force-push against protected branches
# =============================================================================

if [[ "$FORCE_PUSH" == true ]]; then
    if is_protected_branch "$BRANCH"; then
        error "Force-push is blocked on protected branch '${BRANCH}'."
        error "Protected branches: ${PROTECTED_BRANCHES[*]}"
        error "TrafficGenius workflow: dev → main"
        exit 1
    fi
    warn "Force-push enabled for branch '${BRANCH}' (will use --force-with-lease)."
fi

# =============================================================================
# Step 2 — Check for uncommitted changes
# =============================================================================

step "Checking for uncommitted changes..."

# git status --porcelain is the machine-readable format: empty output = clean tree
if [[ -z "$(git status --porcelain)" ]]; then
    info "Working tree is clean — nothing to commit."
    exit 0
fi

success "Changes detected in working tree."

# =============================================================================
# Step 3 — Validate commit message BEFORE modifying any git state
# =============================================================================

if [[ -z "$COMMIT_MESSAGE" ]]; then
    error "No commit message provided."
    error "Usage: ./scripts/git-workflow.sh [options] \"<commit message>\""
    error "Format: type(scope): description"
    error "Types: feat, fix, chore, docs, style, refactor, perf, test, build, ci, revert"
    exit 1
fi

# shellcheck disable=SC2086  # regex variable must be unquoted on RHS of =~
if ! [[ "$COMMIT_MESSAGE" =~ $CONVENTIONAL_COMMIT_REGEX ]]; then
    error "Commit message does not follow Conventional Commits format."
    error "Received: \"${COMMIT_MESSAGE}\""
    error "Expected: type(scope): description"
    error "Valid types: feat, fix, chore, docs, style, refactor, perf, test, build, ci, revert"
    error ""
    error "Examples:"
    error "  feat(dashboard): add IVT classification chart"
    error "  fix(api): resolve null pointer in cloud-armor endpoint"
    error "  chore(deps): update @google-cloud/bigquery to v8.2"
    error "  refactor(gcp): restructure BigQuery query builder"
    exit 1
fi

success "Commit message validated: \"${COMMIT_MESSAGE}\""

# =============================================================================
# Step 4 — Write commit message to file
# =============================================================================

step "Writing commit message to ${COMMIT_MESSAGE_FILE}..."

# Create the parent directory if it doesn't exist
COMMIT_MSG_DIR="$(dirname "$COMMIT_MESSAGE_FILE")"
if [[ ! -d "$COMMIT_MSG_DIR" ]]; then
    mkdir -p "$COMMIT_MSG_DIR"
    info "Created directory: ${COMMIT_MSG_DIR}/"
fi

# Write the commit message to the file
printf '%s\n' "$COMMIT_MESSAGE" > "$COMMIT_MESSAGE_FILE"
success "Commit message written to ${COMMIT_MESSAGE_FILE}."

# =============================================================================
# Step 5 — Stage changes (including the commit message file)
# =============================================================================

step "Staging all changes..."
git add -A
success "All changes staged."

# =============================================================================
# Step 6 — Commit using the message file
# =============================================================================

step "Committing changes..."
git commit -F "$COMMIT_MESSAGE_FILE"
success "Changes committed."

# =============================================================================
# Step 7 — Pull with rebase (detect conflicts before pushing)
# =============================================================================

step "Pulling latest from ${REMOTE}/${BRANCH} with rebase..."

# Only pull if the remote branch exists; new branches skip this step
if git ls-remote --exit-code --heads "$REMOTE" "$BRANCH" >/dev/null 2>&1; then
    if ! git pull --rebase "$REMOTE" "$BRANCH"; then
        error "Rebase conflicts detected during pull."
        error ""
        error "To resolve:"
        error "  1. Fix conflict markers in the files listed above"
        error "  2. Stage resolved files:  git add <file>"
        error "  3. Continue the rebase:   git rebase --continue"
        error ""
        error "To abort and return to pre-pull state:"
        error "  git rebase --abort"
        exit 1
    fi
    success "Pull with rebase completed — no conflicts."
else
    info "No upstream branch '${BRANCH}' on '${REMOTE}'. Skipping pull (new branch)."
fi

# =============================================================================
# Step 8 — Pre-push validation
# =============================================================================

step "Running pre-push validation..."

# 7a: TypeScript type checking
# Project tsconfig.json uses strict mode with "jsx": "react-jsx"
step "  TypeScript type check (tsc --noEmit)..."
if ! npx tsc --noEmit; then
    error "TypeScript type check failed. Fix type errors before pushing."
    exit 1
fi
success "  TypeScript type check passed."

# 7b: ESLint
# Next.js 16 removed `next lint` — this project uses ESLint 9 directly
# via the flat config at eslint.config.js (eslint-config-next w/ core-web-vitals + typescript)
step "  Linting (eslint)..."
if ! npx eslint .; then
    error "Linting failed. Fix lint errors before pushing."
    error "Run 'npm run lint' locally to see all issues."
    exit 1
fi
success "  Linting passed."

# 7c: Prettier formatting check (unless --skip-format is set)
if [[ "$SKIP_FORMAT" == true ]]; then
    info "  Prettier check skipped (--skip-format)."
else
    step "  Formatting check (prettier --check)..."
    if ! npx prettier --check "**/*.{js,jsx,ts,tsx,json,css,md}"; then
        warn "  Formatting issues detected. Running auto-fix..."
        npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,md}"
        # Re-stage any formatting changes and amend the commit
        git add -A
        git commit --amend --no-edit
        success "  Formatting fixed and commit amended."
    else
        success "  Formatting check passed."
    fi
fi

# 7d: Build verification — gated behind --verify-build to avoid full builds on every push
if [[ "$VERIFY_BUILD" == true ]]; then
    step "  Build verification (next build)..."
    if ! npx next build; then
        error "Build verification failed. Fix build errors before pushing."
        exit 1
    fi
    success "  Build verification passed."
else
    info "  Build verification skipped (use --verify-build to enable)."
fi

success "Pre-push validation complete."

# =============================================================================
# Step 9 — Push
# =============================================================================

if [[ "$DRY_RUN" == true ]]; then
    warn "Dry-run mode — skipping push to ${REMOTE}/${BRANCH}."
    info "All validations passed. Run without --dry-run to push."
    exit 0
fi

step "Pushing to ${REMOTE}/${BRANCH}..."

if [[ "$FORCE_PUSH" == true ]]; then
    # --force-with-lease is a safer alternative to --force: it rejects the push
    # if the remote branch has been updated since our last fetch, preventing
    # accidental overwrite of someone else's commits.
    warn "Using --force-with-lease (safer force-push)."
    git push --force-with-lease "$REMOTE" "$BRANCH"
else
    git push "$REMOTE" "$BRANCH"
fi

success "Successfully pushed to ${REMOTE}/${BRANCH}."

# =============================================================================
# Summary
# =============================================================================

printf '\n%s\n' "${GREEN}${BOLD}🎉 Workflow complete!${NC}"
printf '  %s\n' "Branch:  ${BOLD}${BRANCH}${NC}"
printf '  %s\n' "Commit:  ${BOLD}${COMMIT_MESSAGE}${NC}"
if [[ "$FORCE_PUSH" == true ]]; then
    printf '  %s\n' "Push:    ${YELLOW}force-with-lease${NC}"
else
    printf '  %s\n' "Push:    ${GREEN}standard${NC}"
fi
if [[ "$VERIFY_BUILD" == true ]]; then
    printf '  %s\n' "Build:   ${GREEN}verified${NC}"
fi

# Reminder about branching workflow if on dev
if [[ "$BRANCH" == "dev" ]]; then
    printf '\n%s\n' "${BLUE}ℹ ${NC}Next step: merge dev into main when ready for production"
fi
