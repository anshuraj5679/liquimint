# Slither Static Analysis

## Command
```bash
slither . --config-file slither.config.json
```

Fallback if no config file:
```bash
slither . --exclude naming-convention,solc-version
```

## Expected environment
- Python 3.10+
- `pip install slither-analyzer`
- `solc-select use 0.8.20` (or compatible toolchain configuration)

## Report Status
- Execution is environment-dependent and should be run in CI or a local Python-enabled security toolchain.
- Store raw output in this file or under `docs/security/slither/` before final judging packet submission.

## Minimum gate recommendation
1. No high-severity Slither findings.
2. All medium findings triaged with explicit disposition.
3. Any accepted-risk finding linked to mitigation in `MANUAL_AUDIT_NOTES.md`.
