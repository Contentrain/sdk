# Contentrain SDK Developer Guide

## Development Environment Setup

### Requirements

- Node.js (v18 or higher)
- pnpm (v9 or higher)
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/contentrain/contentrain-sdk.git
cd contentrain-sdk

# Install dependencies
pnpm install

# Start in development mode
pnpm dev
```

## Mono Repo Structure

```
contentrain-sdk/
├── packages/
│   ├── query/          # Core query package
│   ├── nuxt/           # Nuxt.js integration
│   └── types-generator/ # TypeScript types generator
├── playground/         # Test and example applications
├── .changeset/        # Version management
└── .github/           # GitHub Actions
```

## Branch Strategy

```
main (production)
  ↑
dev (development)
  ↑
feature/* (feature branches)
```

### Developing New Features

```bash
# Create new branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: added new feature"

# Push to dev branch
git push origin feature/new-feature

# Create PR on GitHub (to dev branch)
```

## Version Management

### Adding Changes

```bash
# Add change description
pnpm changeset

# Answer the prompts:
# 1. Which packages are affected?
# 2. What type of change (major/minor/patch)?
# 3. What is the change description?
```

### Updating Versions

```bash
# Update versions
pnpm changeset version

# package.json and CHANGELOG.md files will be updated
git add .
git commit -m "chore: version packages"
git push
```

### Manual Release

```bash
# Build packages
pnpm build

# Publish to npm
pnpm release
```

## CI/CD Pipeline

### Automated Processes

1. **On Pull Request:**
   - Tests run
   - Lint checks performed
   - Type checking executed
   - Build verification

2. **On Main Branch Merge:**
   - Changesets checks for changes
   - Creates version update PR if needed
   - Auto-publishes to npm when PR is merged

### GitHub Actions Workflows

1. **CI (`ci.yml`):**
   - Runs on every PR and push
   - Performs test, lint, and build checks
   - Tests on Node.js 18 and 20 versions

2. **Release (`release.yml`):**
   - Runs only on main branch
   - Performs version control with Changesets
   - Auto-publishes to npm

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests in a single package
cd packages/query
pnpm test
```

## Lint and Format

```bash
# Lint check
pnpm lint

# Lint fix
pnpm lint:fix

# Type check
pnpm typecheck
```

## Package Scripts

Required scripts for each package:

```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "test:run": "vitest run",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  }
}
```

## Dependency Management

```bash
# Add new dependency (to a package)
cd packages/package-name
pnpm add package-name

# Add dev dependency
pnpm add -D package-name

# Add workspace dependency
pnpm add @contentrain/package-name@workspace:*

# Update all dependencies
pnpm update-deps
```

## Troubleshooting

1. **Build Issues:**
   ```bash
   # Clean build
   pnpm clean
   pnpm build
   ```

2. **Dependency Issues:**
   ```bash
   # Clean lock file
   rm pnpm-lock.yaml
   pnpm install
   ```

3. **Type Issues:**
   ```bash
   # Type check
   pnpm typecheck
   ```

## NPM Publish Checklist

1. Ensure all tests pass
2. Check changelog updates
3. Verify package.json versions
4. Check build files
5. Perform final pre-publish checks

## Helpful Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [pnpm Workspace Guide](https://pnpm.io/workspaces)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
