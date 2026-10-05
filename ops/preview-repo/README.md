# PanaCalc V2 preview repository

This repository is only a GitHub Pages deployment surface for the V2 beta.

Source of truth remains `barbasmarcosi/PanaCalc`, branch `feat/panacalc-v2`.

Copy `deploy-pages.yml` to `.github/workflows/deploy-pages.yml` in the public `barbasmarcosi/PanaCalc-V2` repository and enable **Pages → GitHub Actions**.

The workflow pulls the public V2 source directly, builds with preview mode, and deploys under `/PanaCalc-V2/`. It needs no PAT and must not contain application source.
