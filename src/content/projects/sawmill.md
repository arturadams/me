---
title: Sawmill — CI insight for monorepos
numeral: 弐
year: 2025
order: 2
outcome:
  value: −62%
  label: Time lost to flaky tests
tags: [Go, ClickHouse, gRPC, Svelte, Kubernetes]
---

Developer tool that traces flaky tests back to the commits that made them flaky.
A Go ingestion pipeline chewing through 40&nbsp;GB of test logs daily, a query
layer over ClickHouse, and a frontend where every chart answers exactly one question.
