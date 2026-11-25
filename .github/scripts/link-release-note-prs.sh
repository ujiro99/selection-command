#!/usr/bin/env bash
# Replace the short commit SHA at the end of each release note line with a
# link to the pull request that brought the commit in.
#
# git-cliff only knows the PR of a PR's merge commit, which this repository
# skips, so lines generated from the individual commits end with "(<sha>)".
# This script asks GitHub which PR each commit belongs to.
#
# Usage: link-release-note-prs.sh <notes file> <owner/repo>
# Requires: gh (authenticated via GH_TOKEN), jq, and the full git history.
# Lines whose PR cannot be found keep their SHA.

set -euo pipefail

notes_file="$1"
repo="$2"
tmp_file="$(mktemp)"

# Look up the feature PR of a commit. The release branch PRs (dev-*) also
# contain every commit, so they are ignored. A commit belongs to a few PRs at
# most, so the first page (30 PRs) of the API is enough.
# API errors go to stderr so that the cause shows up in the workflow log.
find_pr() {
  local full_sha result
  full_sha="$(git rev-parse --verify --quiet "$1^{commit}")" || return 0
  # On an HTTP error gh prints the error body to stdout, so accept only a number.
  if result="$(gh api "repos/${repo}/commits/${full_sha}/pulls" \
    --jq '[.[] | select(.merged_at != null and (.head.ref | startswith("dev-") | not))] | sort_by(.merged_at) | first | .number // empty')" &&
    [[ "$result" =~ ^[0-9]+$ ]]; then
    echo "$result"
  elif [ -n "$result" ]; then
    echo "Failed to look up the PR of $1: $result" >&2
  fi
}

missing=0
line_pattern='^(- .*) \(([0-9a-f]{7,40})\)$'

while IFS= read -r line || [ -n "$line" ]; do
  if [[ "$line" =~ $line_pattern ]]; then
    text="${BASH_REMATCH[1]}"
    sha="${BASH_REMATCH[2]}"
    pr="$(find_pr "$sha")"
    if [ -n "$pr" ]; then
      line="${text} ([#${pr}](https://github.com/${repo}/pull/${pr}))"
    else
      missing=$((missing + 1))
    fi
  fi
  printf '%s\n' "$line" >>"$tmp_file"
done <"$notes_file"

mv "$tmp_file" "$notes_file"

# Lookups fail silently (e.g. rate limits), so report how many lines kept SHAs.
if [ "$missing" -gt 0 ]; then
  echo "::warning::${missing} release note line(s) kept the commit SHA; their PR was not found."
fi
