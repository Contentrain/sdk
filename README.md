# Contentrain SDK

Official JavaScript/TypeScript SDK for Contentrain CMS. This monorepo contains packages that help you integrate Contentrain's content management system into your JavaScript/TypeScript projects.

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@contentrain/core](./packages/core) | 1.0.0 | Core SDK package providing content loading, querying, and caching functionality. |
| [@contentrain/nuxt](./packages/nuxt) | 1.0.0 | Official Nuxt.js integration module. |
| [@contentrain/types-generator](./packages/types-generator) | 1.0.0 | Tool for automatically generating TypeScript type definitions for content models. |

## 🚀 Getting Started

Each package can be installed and used independently. Choose the package that suits your needs:

```bash
# For core package
npm install @contentrain/core

# For Nuxt module
npm install @contentrain/nuxt

# For type generator (as a dev dependency)
npm install -D @contentrain/types-generator
```

## 📖 Documentation

Each package has its own detailed documentation in its README file:

- [@contentrain/core documentation](./packages/core/README.md)
- [@contentrain/nuxt documentation](./packages/nuxt/README.md)
- [@contentrain/types-generator documentation](./packages/types-generator/README.md)

## 🛠️ Development

### Requirements

- Node.js >= 18
- pnpm >= 8

### Setup

```bash
# Clone the repository
git clone https://github.com/contentrain/contentrain-sdk.git

# Navigate to directory
cd contentrain-sdk

# Install dependencies
pnpm install

# Build packages
pnpm build

# Run tests
pnpm test
```

### Monorepo Structure

```
contentrain-sdk/
├── packages/
│   ├── core/           # Core SDK package
│   ├── nuxt/           # Nuxt.js module
│   └── types-generator/ # Type generator
├── playground/         # Test and example applications
└── package.json       # Monorepo configuration
```

## 🤝 Contributing

1. Fork this repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## 📝 License

MIT
