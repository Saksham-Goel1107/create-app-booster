# Create App Booster

🚀 A fast CLI tool to quickly generate React projects with Vite or Next.js, pre-configured with Husky, Jest, GitHub CI/CD, and Snyk.

## Features

- ⚡️ **Lightning Fast** - Set up a full project in under a minute
- 🛠️ Scaffold **Vite React** or **Next.js** applications
- 📦 Choose **npm** or **pnpm** as your package manager
- 🔄 Work in current directory with `.` or create a new folder
- 🔧 Flexible configuration with only the tools you need:
  - TypeScript (optional)
  - ESLint and Prettier (optional)
  - Jest testing framework (optional)
  - Husky Git hooks (optional)
- 🚦 GitHub Actions workflows for CI/CD
- 🛡️ **Snyk** security scanning integration
- 📱 Deployment configurations for **Vercel**, **Netlify**, or **Render**
- 🔄 Git initialization with sensible defaults

## Installation

```bash
npm install -g create-app-booster
```

## Usage

Just run:

```bash
create-app-booster my-new-app
```

Or create a project in your current directory:

```bash
create-app-booster .
```

And follow the interactive prompts to choose your preferred:
- Project type (Vite React or Next.js)
- Package manager (npm or pnpm)
- TypeScript or JavaScript
- Linting with ESLint and Prettier
- Jest for testing
- Deployment platform (Vercel, Netlify, or Render)
- Git initialization
- Husky Git hooks

## Performance

Create App Booster is optimized for speed, generating your project in less than a minute by:
- Running processes in parallel where possible
- Optimizing dependency installation
- Using faster flags for npm/pnpm
- Avoiding unnecessary installs based on your choices

## What's Included

### Based on Your Choices

Only the features you select are installed and configured:

- 🔤 **TypeScript/JavaScript**: Choose your preferred language
- 🧹 **ESLint + Prettier**: Code quality tools (optional)
- 🧪 **Testing**: Jest configuration with React Testing Library (optional)
- 🔄 **Git Hooks**: Husky for pre-commit linting (optional)

### Always Included

- 🚦 **GitHub Actions CI/CD workflows**: Ready for continuous integration
- 🛡️ **Snyk security scanning**: Keep dependencies secure
- 📄 **Customized README**: Based on your project configuration
- 📱 **Deployment configs**: For your selected platform

## License

MIT