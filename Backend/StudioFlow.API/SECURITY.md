# Security Notes

This project keeps real secrets out of git.

## Do not commit
- `Jwt__SecretKey`
- Database passwords/connection strings with credentials
- Any API keys, tokens, private keys

## Safe in repository
- `appsettings.json` and `appsettings.Development.json` with placeholder values only
- `.env.example` with example values only

## How to provide real secrets locally
Use one of these options:
1. OS environment variables (`Jwt__SecretKey`, etc.)
2. `dotnet user-secrets` for local development

## Reviewer signal
When reviewing PRs, verify that:
1. No real secret values were added to tracked files
2. New secret keys are documented in `.env.example`
3. Runtime reads secrets from environment/secret store
