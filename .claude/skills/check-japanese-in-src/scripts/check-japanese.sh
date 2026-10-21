#!/usr/bin/env bash

rg -n -l '[ぁ-んァ-ン一-龠]' ./packages/extension/src \
  --glob '!**/*.stories.tsx' \
  --glob '!**/*.test.*' \
  --glob '!**/lib/locale*' \
  --glob '!content/'

rg -n -l '[ぁ-んァ-ン一-龠]' ./packages/extension/e2e \
  --glob '!**/*.stories.tsx' \
  --glob '!**/*.test.*' \
  --glob '!**/lib/locale*' \
  --glob '!content/'
