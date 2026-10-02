# SchoolManager (Legacy CodeIgniter 3 Modernization)

This repository is the sanitized source baseline for the existing CodeIgniter 3 school management system.

> **Production safety:** `/home/lightworld/webapps/rochas` is the live legacy production directory and is completely out of scope for this project. Do not inspect, read, modify, build in, migrate, deploy to, or otherwise use it unless the owner explicitly re-authorizes access. All modernization work belongs in `/home/lightworld/webapps/schoolmanager` and the GitHub repository.

- Framework: CodeIgniter 3 / PHP
- Production target: `/home/lightworld/webapps/schoolmanager`
- Production URL: `https://schoolmanager.lightworldtech.com`
- Database name: `lightworld_schoolmanager_db`
- Database user: `lightworld_db_user`
- Secrets are intentionally excluded from Git.
- The authoritative schema reference for modernization is a redacted structure-only template derived from the October 2, 2026 SQL dump supplied by the owner.

The modernization rule is strict: preserve existing business logic and workflows while improving presentation, accessibility, responsive UX, maintainability, safe query performance, and offline/online synchronization readiness.
