// Conventional Commits rules for commit messages and PR titles.
// The commit-msg hook only warns, so a non-conforming message is still committed.
// Release notes (git-cliff, Hub's What's New draft) rely on these types.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Japanese subjects and proper nouns at the start are allowed.
    "subject-case": [0],
    // Long URLs (e.g. session links) may appear in trailers.
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
}
