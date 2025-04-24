#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import { execa } from 'execa';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

const INSTALL_FLAGS = {
  npm: ['install', '--prefer-offline', '--no-audit', '--progress=false'],
  pnpm: ['add', '--prefer-offline', '--silent']
};

process.on('SIGINT', async () => {
  console.log('\n');
  
  if (global.activeSpinner) {
    global.activeSpinner.stop();
  }
  
  try {
    const { confirmExit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmExit',
        message: 'Are you sure you want to exit?',
        default: true
      }
    ]);
    
    if (confirmExit) {
      console.log(chalk.yellow('Setup cancelled. Goodbye!'));
      process.exit(0);
    } else {
      console.log(chalk.green('Continuing setup...'));
      
      if (global.activeSpinner) {
        global.activeSpinner.start();
      }
      return;
    }
  } catch (error) {
    console.log(chalk.yellow('\nSetup cancelled. Goodbye!'));
    process.exit(0);
  }
});

program
  .name('create-app-booster')
  .description('CLI to create Vite React or Next.js projects with Husky and GitHub CI/CD pre-configured')
  .version('1.0.0')
  .argument('[project-directory]', 'Directory to create the project in')
  .action(async (projectDirectory) => {
    console.log(chalk.bold.blue('🚀 Welcome to App Booster! Let\'s set up your project.'));
    
    let targetDir = projectDirectory;
    if (!targetDir) {
      const { projectName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'What is the name of your project?',
          default: 'my-app',
          validate: (input) => {
            if (input === '.') return true;
            if (/^([A-Za-z\-_\d])+$/.test(input)) return true;
            return 'Project name may only include letters, numbers, underscores and hashes, or use "." for current directory.';
          }
        }
      ]);
      targetDir = projectName;
    }
    
    const isCurrentDir = targetDir === '.';
    const projectName = isCurrentDir ? path.basename(process.cwd()) : targetDir;
    const resolvedTargetDir = isCurrentDir ? process.cwd() : path.resolve(process.cwd(), targetDir);
    
    if (fs.existsSync(resolvedTargetDir) && fs.readdirSync(resolvedTargetDir).length > 0 && !isCurrentDir) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `The directory ${chalk.cyan(targetDir)} is not empty. Do you want to overwrite it?`,
          default: false
        }
      ]);
      
      if (!overwrite) {
        console.log(chalk.red('Operation cancelled.'));
        return;
      }
      
      fs.emptyDirSync(resolvedTargetDir);
    }
    
    if (!isCurrentDir) {
      fs.ensureDirSync(resolvedTargetDir);
    }
    
    const { projectType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'projectType',
        message: 'What type of project do you want to create?',
        choices: [
          { name: 'React with Vite', value: 'vite' },
          { name: 'Next.js', value: 'nextjs' }
        ]
      }
    ]);
    
    const { packageManager } = await inquirer.prompt([
      {
        type: 'list',
        name: 'packageManager',
        message: 'Which package manager do you want to use?',
        choices: [
          { name: 'npm', value: 'npm' },
          { name: 'pnpm', value: 'pnpm' }
        ]
      }
    ]);
    
    let actualPackageManager = packageManager;
    if (packageManager === 'pnpm') {
      try {
        await execa('pnpm', ['--version']);
      } catch (error) {
        console.log(chalk.yellow('pnpm not found. Using npm instead.'));
        actualPackageManager = 'npm';
      }
    }

    const { languageOption } = await inquirer.prompt([
      {
        type: 'list',
        name: 'languageOption',
        message: 'Which language option do you want to use?',
        choices: [
          { name: 'TypeScript', value: 'typescript' },
          { name: 'JavaScript', value: 'javascript' },
          { name: 'TypeScript + Service Worker', value: 'typescript-sw' },
          { name: 'JavaScript + Service Worker', value: 'javascript-sw' }
        ]
      }
    ]);
    
    const useTypeScript = languageOption.includes('typescript');
    const useServiceWorker = languageOption.includes('-sw');
    
    const { confirmLanguageOption } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmLanguageOption',
        message: `You selected ${chalk.cyan(languageOption)}. Is this correct?`,
        default: true
      }
    ]);
    
    if (!confirmLanguageOption) {
      console.log(chalk.red('Operation cancelled.'));
      return;
    }

    const setupChoices = [
      { name: 'ESLint and Prettier', value: 'linting' },
      { name: 'Jest for testing', value: 'jest' },
      { name: 'GitHub Actions for CI/CD', value: 'github' },
      { name: 'Snyk for security scanning', value: 'snyk' },
      { name: 'Husky for Git hooks', value: 'husky' },
      { name: 'Git initialization', value: 'git' }
    ];

    const { selectedSetup } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedSetup',
        message: 'Select additional setup options:',
        choices: setupChoices,
        default: ['linting', 'jest', 'git', 'husky']
      }
    ]);

    const { deploymentPlatform } = await inquirer.prompt([
      {
        type: 'list',
        name: 'deploymentPlatform',
        message: 'Which deployment platform would you like to configure?',
        choices: [
          { name: 'None', value: 'none' },
          { name: 'Vercel', value: 'vercel' },
          { name: 'Netlify', value: 'netlify' },
          { name: 'Render', value: 'render' }
        ]
      }
    ]);
    
    const enableLinting = selectedSetup.includes('linting');
    const setupJest = selectedSetup.includes('jest');
    const setupGithubActions = selectedSetup.includes('github');
    const setupSnyk = selectedSetup.includes('snyk');
    const setupHusky = selectedSetup.includes('husky');
    const initGit = selectedSetup.includes('git');

    const { confirmSetup } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmSetup',
        message: 'Would you like to proceed with these settings?',
        default: true
      }
    ]);
    
    if (!confirmSetup) {
      console.log(chalk.red('Setup cancelled.'));
      return;
    }
    
    const userPreferences = {
      projectType,
      packageManager: actualPackageManager,
      useTypeScript,
      useServiceWorker,
      languageOption,
      enableLinting,
      setupJest,
      setupGithubActions,
      setupSnyk,
      deploymentPlatform,
      initGit,
      setupHusky,
      projectName,
      isCurrentDir
    };
    
    console.log(chalk.cyan('\n🛠️  Creating your project...'));
    
    const mainSpinner = ora('Setting up project structure...').start();
    const startTime = Date.now();
    
    try {
      if (projectType === 'vite') {
        await createViteProject(resolvedTargetDir, actualPackageManager, useTypeScript, isCurrentDir);
      } else {
        await createNextProject(resolvedTargetDir, actualPackageManager, useTypeScript, isCurrentDir);
      }
      
      mainSpinner.text = 'Copying LICENSE file...';
      try {
        const licensePath = path.join(__dirname, '../LICENSE');
        if (fs.existsSync(licensePath)) {
          await fs.copyFile(licensePath, path.join(resolvedTargetDir, 'LICENSE'));
        }
      } catch (licenseError) {
        console.warn(chalk.yellow('Failed to copy LICENSE file.'));
      }
      
      const templateProcessingPromises = [];
      const templatesToCopy = [];
      
      if (setupGithubActions) {
        templatesToCopy.push('common/github');
      }
      
      if (setupSnyk) {
        templatesToCopy.push('common/snyk');
      }
      
      if (enableLinting) {
        templatesToCopy.push('common/linting');
        templatesToCopy.push(`${projectType}/linting`);
      }
      
      if (setupHusky) {
        templatesToCopy.push('common/husky');
      }
      
      if (setupJest) {
        templatesToCopy.push('common/jest');
        
        if (useTypeScript) {
          templatesToCopy.push(`${projectType}/jest-ts`);
        } else {
          const jestDir = `${projectType}/jest`;
          if (fs.existsSync(path.join(__dirname, `../templates/${jestDir}`))) {
            templatesToCopy.push(jestDir);
          }
        }
      }
      
      if (deploymentPlatform !== 'none') {
        templatesToCopy.push(`common/deployment/${deploymentPlatform}`);
        
        const deploymentDir = `${projectType}/deployment/${deploymentPlatform}`;
        if (fs.existsSync(path.join(__dirname, `../templates/${deploymentDir}`))) {
          templatesToCopy.push(deploymentDir);
        }
      }
      
      if (useServiceWorker) {
        mainSpinner.text = 'Setting up Service Worker...';
        await setupServiceWorker(resolvedTargetDir, projectType, useTypeScript);
      }
      
      if (templatesToCopy.length > 0) {
        mainSpinner.text = 'Copying configuration files...';
        await Promise.all(templatesToCopy.map(template => copyTemplates(template, resolvedTargetDir, userPreferences)));
      }
      
      mainSpinner.text = 'Updating package.json...';
      await updatePackageJson(resolvedTargetDir, projectType, userPreferences);
      
      mainSpinner.text = 'Installing dependencies...';
      
      const devDependencies = [];
      const dependencies = [];
      
      if (enableLinting) {
        devDependencies.push(
          'eslint@~8.38.0', 
          'prettier@latest',
          'eslint-config-prettier@latest',
          'eslint-plugin-prettier@latest'
        );
        
        if (useTypeScript) {
          devDependencies.push(
            '@typescript-eslint/eslint-plugin@^6.14.0',
            '@typescript-eslint/parser@^6.14.0',
            '@typescript-eslint/utils@^6.14.0'  
          );
        }
        
        if (projectType === 'vite') {
          devDependencies.push(
            'eslint-plugin-react@^7.33.2',
            'eslint-plugin-react-hooks@^4.6.0',
            'eslint-plugin-react-refresh@^0.4.5'
          );
        }
      }
      
      if (setupJest) {
        devDependencies.push(
          'jest@latest',
          '@testing-library/react@latest',
          '@testing-library/jest-dom@latest',
          '@testing-library/user-event@latest',
          'identity-obj-proxy@latest'
        );
        
        if (useTypeScript) {
          devDependencies.push('@types/jest@latest', 'ts-jest@latest');
        }
        
        if (projectType === 'vite') {
          devDependencies.push('jest-environment-jsdom@latest');
          if (useTypeScript) {
            devDependencies.push(
              '@vitejs/plugin-react@latest',
              'vite-tsconfig-paths@latest'
            );
          }
        }
      }
      
      if (useServiceWorker) {
        if (projectType === 'vite') {
          devDependencies.push(
            'vite-plugin-pwa@latest',
            'workbox-window@latest',
            'workbox-core@latest',
            'workbox-precaching@latest'
          );
        } else {
          dependencies.push('next-pwa@latest');
        }
      }
      
      if (setupHusky) {
        devDependencies.push('husky@latest', 'lint-staged@latest');
      }
      
      const installCmd = packageManager === 'npm' ? 'npm' : 'pnpm';
      await execa(installCmd, ['install'], { cwd: resolvedTargetDir, stdio: 'pipe' });
      
      if (devDependencies.length > 0) {
        try {
          await execa(packageManager, [
            ...(packageManager === 'npm' ? ['install', '--prefer-offline', '--no-audit', '--progress=false'] : ['add', '--prefer-offline', '--silent']),
            ...devDependencies,
            '--save-dev'
          ], { cwd: resolvedTargetDir, stdio: 'pipe' });
        } catch (error) {
          console.error(chalk.yellow(`Failed to install dev dependencies: ${error.message}`));
          console.log(chalk.cyan('Trying alternative installation method...'));
          
          for (const dep of devDependencies) {
            try {
              await execa(packageManager, [
                ...(packageManager === 'npm' ? ['install', '--prefer-offline', '--progress=false'] : ['add', '--prefer-offline', '--silent']),
                dep,
                '--save-dev'
              ], { cwd: resolvedTargetDir, stdio: 'pipe' });
            } catch (depError) {
              console.warn(chalk.yellow(`Failed to install ${dep}: ${depError.message}`));
            }
          }
        }
      }
      
      if (dependencies.length > 0) {
        try {
          await execa(packageManager, [
            ...(packageManager === 'npm' ? ['install', '--prefer-offline', '--no-audit', '--progress=false'] : ['add', '--prefer-offline', '--silent']),
            ...dependencies
          ], { cwd: resolvedTargetDir, stdio: 'pipe' });
        } catch (error) {
          console.error(chalk.yellow(`Failed to install dependencies: ${error.message}`));
          console.log(chalk.cyan('Trying alternative installation method...'));
          
          for (const dep of dependencies) {
            try {
              await execa(packageManager, [
                ...(packageManager === 'npm' ? ['install', '--prefer-offline', '--progress=false'] : ['add', '--prefer-offline', '--silent']),
                dep
              ], { cwd: resolvedTargetDir, stdio: 'pipe' });
            } catch (depError) {
              console.warn(chalk.yellow(`Failed to install ${dep}: ${depError.message}`));
            }
          }
        }
      }
      
      if (initGit) {
        mainSpinner.text = 'Initializing Git repository...';
        try {
          await execa('git', ['init'], { cwd: resolvedTargetDir, stdio: 'pipe' });
          
          const gitignorePath = path.join(resolvedTargetDir, '.gitignore');
          if (!fs.existsSync(gitignorePath)) {
            const defaultGitignore = [
              'node_modules',
              'dist',
              '.env',
              '.env.local',
              '.env.development.local',
              '.env.test.local',
              '.env.production.local',
              '.DS_Store',
              'coverage',
              '.idea',
              '.vscode',
              '*.log',
              'npm-debug.log*',
              'yarn-debug.log*',
              'yarn-error.log*',
              'pnpm-debug.log*'
            ].join('\n');
            
            fs.writeFileSync(gitignorePath, defaultGitignore);
          }
        } catch (error) {
          console.warn(chalk.yellow(`Failed to initialize Git repository: ${error.message}`));
        }
      }
      
      if (setupHusky) {
        mainSpinner.text = 'Setting up Husky git hooks...';
        try {
          if (!devDependencies.includes('husky@latest')) {
            const installFlags = INSTALL_FLAGS[packageManager] || ['install'];
            await execa(packageManager, [
              ...installFlags,
              'husky@latest',
              'lint-staged@latest',
              '--save-dev'
            ], { cwd: resolvedTargetDir, stdio: 'pipe' });
          }
          
          await execa(packageManager === 'npm' ? 'npx' : 'pnpm', [
            ...(packageManager === 'npm' ? [] : ['dlx']), 
            'husky', 
            'install'
          ], { cwd: resolvedTargetDir, stdio: 'pipe' });
          
          const packageJsonPath = path.join(resolvedTargetDir, 'package.json');
          const packageJson = await fs.readJson(packageJsonPath);
          packageJson.scripts = {
            ...packageJson.scripts,
            prepare: 'husky install'
          };
          await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
          
          const hookContent = `#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n\n${packageManager === 'npm' ? 'npx' : 'pnpm exec'} lint-staged\n`;
          fs.ensureDirSync(path.join(resolvedTargetDir, '.husky'));
          fs.writeFileSync(
            path.join(resolvedTargetDir, '.husky', 'pre-commit'),
            hookContent,
            { mode: 0o755 }
          );
        } catch (error) {
          console.warn(chalk.yellow('Failed to setup Husky. Git hooks will need to be set up manually.'));
          console.warn(chalk.yellow(error.message));
        }
      }
      
      if (initGit) {
        try {
          await execa('git', ['add', '.'], { cwd: resolvedTargetDir, stdio: 'pipe' });
          await execa('git', ['commit', '-m', 'Initial commit'], { cwd: resolvedTargetDir, stdio: 'pipe' });
        } catch (error) {
          console.warn(chalk.yellow(`Failed to create initial commit: ${error.message}`));
        }
      }
      
      mainSpinner.text = 'Generating README...';
      await setupReadme(resolvedTargetDir, userPreferences);
      
      const elapsedTime = Math.round((Date.now() - startTime) / 1000);
      mainSpinner.succeed(chalk.green(`Project ${projectName} created successfully in ${elapsedTime} seconds!`));
      
      console.log('\n' + chalk.bold.green('✅ Everything is set up and ready to go!'));
      console.log(chalk.bold('🚀 You can start coding right away.\n'));
      
      if (!isCurrentDir) {
        console.log('To get started:');
        console.log(chalk.cyan(`  cd ${targetDir}`));
      } else {
        console.log('Your project is ready in the current directory!');
      }
      
      console.log(chalk.cyan(`  ${actualPackageManager} run dev`));
      
      console.log('\nAvailable commands:');
      console.log(chalk.cyan(`  ${actualPackageManager} run dev`));
      console.log(chalk.cyan(`  ${actualPackageManager} run build`));
      
      if (setupJest) {
        console.log(chalk.cyan(`  ${actualPackageManager} test`));
      }
      
      if (enableLinting) {
        console.log(chalk.cyan(`  ${actualPackageManager} run lint`));
        console.log(chalk.cyan(`  ${actualPackageManager} run lint:fix`));
      }
      
      console.log('\nHappy coding! 🎉\n');
    } catch (error) {
      mainSpinner.fail(chalk.red('Failed to create project.'));
      console.error(chalk.red(error));
    }
  });

async function createViteProject(targetDir, packageManager, useTypeScript, isCurrentDir) {
  const command = packageManager === 'npm' ? 'npx' : 'pnpm dlx';
  const args = command === 'npx' ? [] : ['dlx'];
  
  await execa(command.split(' ')[0], [
    ...args,
    'create-vite@latest', 
    ...(isCurrentDir ? ['.'] : [path.basename(targetDir)]),
    '--template', 
    useTypeScript ? 'react-ts' : 'react',
    '--force'
  ], { 
    stdio: 'pipe',
    cwd: isCurrentDir ? targetDir : path.dirname(targetDir)
  });
}

async function createNextProject(targetDir, packageManager, useTypeScript, isCurrentDir) {
  try {
    const tempDir = path.join(targetDir, '_temp_nextjs_setup');

    const command = packageManager === 'npm' ? 'npx' : 'pnpm';
    const commandArgs = packageManager === 'npm' ? [] : ['dlx'];
    
    console.log(chalk.blue('Creating temporary Next.js project structure...'));
    
    fs.ensureDirSync(targetDir);
    
    const packageJson = {
      name: path.basename(targetDir),
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      },
      devDependencies: {}
    };
    
    if (useTypeScript) {
      packageJson.devDependencies = {
        "@types/node": "^20.1.0",
        "@types/react": "^18.2.0",
        "@types/react-dom": "^18.2.0",
        "typescript": "^5.0.0"
      };
    }
    
    if (!isCurrentDir) {
      fs.ensureDirSync(targetDir);
    }
    
    await fs.writeJson(path.join(targetDir, 'package.json'), packageJson, { spaces: 2 });
    
    const appDir = path.join(targetDir, 'app');
    fs.ensureDirSync(appDir);
    
    const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
`;
    await fs.writeFile(path.join(targetDir, 'next.config.js'), nextConfigContent);
    
    if (useTypeScript) {
      const tsConfigContent = `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;
      await fs.writeFile(path.join(targetDir, 'tsconfig.json'), tsConfigContent);
      
      const nextEnvContent = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.`;
      await fs.writeFile(path.join(targetDir, 'next-env.d.ts'), nextEnvContent);
    } 
    
    const extension = useTypeScript ? 'tsx' : 'jsx';
    const pageContent = useTypeScript 
      ? `export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Welcome to Next.js with App Booster</h1>
    </main>
  );
}`
      : `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Welcome to Next.js with App Booster</h1>
    </main>
  );
}`;
    
    await fs.writeFile(path.join(appDir, `page.${extension}`), pageContent);
    
    const layoutContent = useTypeScript
      ? `import { ReactNode } from 'react';

export const metadata = {
  title: 'Next.js App with App Booster',
  description: 'Created with create-app-booster',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`
      : `export const metadata = {
  title: 'Next.js App with App Booster',
  description: 'Created with create-app-booster',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`;
    
    await fs.writeFile(path.join(appDir, `layout.${extension}`), layoutContent);
    
    const gitignoreContent = `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts`;
    
    await fs.writeFile(path.join(targetDir, '.gitignore'), gitignoreContent);
    
    const eslintConfig = {
      extends: 'next/core-web-vitals'
    };
    await fs.writeJson(path.join(targetDir, '.eslintrc.json'), eslintConfig);
    
    fs.ensureDirSync(path.join(targetDir, 'public'));
    
    console.log(chalk.blue(`Installing Next.js dependencies...`));
    
    await execa(packageManager, ['install'], { 
      stdio: 'pipe',
      cwd: targetDir
    });
    
    console.log(chalk.green('Next.js project structure created successfully!'));
    return true;
  } catch (error) {
    console.error(`Error creating Next.js project: ${error.message}`);
    throw error;
  }
}

async function setupServiceWorker(targetDir, projectType, useTypeScript) {
  if (projectType === 'vite') {
    await fs.ensureDir(path.join(targetDir, 'src'));
    await fs.ensureDir(path.join(targetDir, 'public'));
    
    const viteConfigTemplatePath = path.join(__dirname, '../templates/vite/config/vite.config.ts');
    const viteConfigDestPath = path.join(targetDir, useTypeScript ? 'vite.config.ts' : 'vite.config.js');
    
    if (await fs.pathExists(viteConfigTemplatePath)) {
      let viteConfigContent = await fs.readFile(viteConfigTemplatePath, 'utf8');
      
      if (!useTypeScript) {
        viteConfigContent = viteConfigContent
          .replace(/\.ts/g, '.js')
          .replace(/: string/g, '')
          .replace(/: boolean/g, '')
          .replace(/: any/g, '');
      }
      
      await fs.writeFile(viteConfigDestPath, viteConfigContent);
    } else {
      const viteConfig = useTypeScript 
        ? `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      manifest: {
        name: '${path.basename(targetDir)}',
        short_name: '${path.basename(targetDir)}',
        theme_color: '#ffffff',
        icons: [{
          src: 'favicon.ico',
          sizes: '64x64 32x32 24x24 16x16',
          type: 'image/x-icon'
        }]
      }
    })
  ]
});`
        : `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: 'src',
      filename: 'sw.js',
      strategies: 'injectManifest',
      manifest: {
        name: '${path.basename(targetDir)}',
        short_name: '${path.basename(targetDir)}',
        theme_color: '#ffffff',
        icons: [{
          src: 'favicon.ico',
          sizes: '64x64 32x32 24x24 16x16',
          type: 'image/x-icon'
        }]
      }
    })
  ]
});`;
      
      await fs.writeFile(viteConfigDestPath, viteConfig);
    }
    
    const swFileName = useTypeScript ? 'sw.ts' : 'sw.js';
    const swFilePath = path.join(targetDir, 'src', swFileName);
    const swContent = useTypeScript 
      ? `import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('fetch', (event) => {});
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});`
      : `import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('fetch', (event) => {});
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});`;
    
    await fs.ensureDir(path.dirname(swFilePath));
    await fs.writeFile(swFilePath, swContent);
    
    const registerDestDir = path.join(targetDir, 'src', 'lib');
    await fs.ensureDir(registerDestDir);
    
    if (useTypeScript) {
      const typeDeclarationPath = path.join(__dirname, '../templates/vite/config/vite-pwa.d.ts');
      const typeDestDir = path.join(targetDir, 'src', 'types');
      await fs.ensureDir(typeDestDir);
      
      if (await fs.pathExists(typeDeclarationPath)) {
        await fs.copyFile(typeDeclarationPath, path.join(typeDestDir, 'vite-pwa.d.ts'));
      }
    }
    
    const registerTemplatePath = path.join(__dirname, '../templates/vite/config/pwa-register.ts');
    if (await fs.pathExists(registerTemplatePath)) {
      let registerContent = await fs.readFile(registerTemplatePath, 'utf8');
      
      if (!useTypeScript) {
        registerContent = registerContent.replace(/: (\w+)/g, '');
      }
      
      const registerDestPath = path.join(registerDestDir, useTypeScript ? 'pwa-register.ts' : 'pwa-register.js');
      await fs.writeFile(registerDestPath, registerContent);
    } else {
      const registerContent = useTypeScript
        ? `// This file sets up the service worker

export function setupPWA(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}`
        : `// This file sets up the service worker

export function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}`;
      
      const registerDestPath = path.join(registerDestDir, useTypeScript ? 'pwa-register.ts' : 'pwa-register.js');
      await fs.writeFile(registerDestPath, registerContent);
    }
    
    const publicDir = path.join(targetDir, 'public');
    await fs.ensureDir(publicDir);
    
    const manifestContent = `{
  "name": "${path.basename(targetDir)}",
  "short_name": "${path.basename(targetDir)}",
  "description": "Progressive Web App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ]
}`;
    
    await fs.writeFile(path.join(publicDir, 'manifest.json'), manifestContent);
    
    const indexHtmlPath = path.join(targetDir, 'index.html');
    if (await fs.pathExists(indexHtmlPath)) {
      let htmlContent = await fs.readFile(indexHtmlPath, 'utf8');
      
      if (!htmlContent.includes('manifest.json')) {
        htmlContent = htmlContent.replace(
          '<head>',
          `<head>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#000000">`
        );
      }
      
      await fs.writeFile(indexHtmlPath, htmlContent);
    }
    
  } else {
    const nextConfigPath = path.join(targetDir, 'next.config.js');
    
    try {
      await execa('npm', ['install', '--save', 'next-pwa'], { 
        cwd: targetDir, 
        stdio: 'pipe' 
      });
      
      console.log(chalk.green('Installed next-pwa successfully'));
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not install next-pwa: ${error.message}`));
    }
    
    const nextConfigContent = `/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
});

const nextConfig = {};

module.exports = withPWA(nextConfig);
`;
    
    await fs.writeFile(nextConfigPath, nextConfigContent);
    
    const manifestContent = `{
  "name": "${path.basename(targetDir)}",
  "short_name": "${path.basename(targetDir)}",
  "description": "Progressive Web App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ]
}`;
    
    const publicDir = path.join(targetDir, 'public');
    await fs.ensureDir(publicDir);
    await fs.writeFile(path.join(publicDir, 'manifest.json'), manifestContent);
    
    const eslintConfigPath = path.join(targetDir, '.eslintrc.json');
    const eslintConfig = {
      extends: "next/core-web-vitals"
    };
    await fs.writeJson(eslintConfigPath, eslintConfig);
    
    const eslintJsConfigPath = path.join(targetDir, '.eslintrc.js');
    const eslintJsContent = `module.exports = {
  extends: ['next/core-web-vitals'],
};
`;
    await fs.writeFile(eslintJsConfigPath, eslintJsContent);
  }
}

function copyTemplates(templateDir, targetDir, userPreferences) {
  const sourceDir = path.join(__dirname, '../templates', templateDir);
  if (!fs.existsSync(sourceDir)) return;

  const files = fs.readdirSync(sourceDir, { withFileTypes: true });
  
  return Promise.all(files.map(async (file) => {
    const sourcePath = path.join(sourceDir, file.name);
    const targetPath = path.join(targetDir, file.name);

    if (file.isDirectory()) {
      await fs.ensureDir(targetPath);
      return copyTemplates(path.join(templateDir, file.name), targetPath, userPreferences);
    } else {
      if (file.name === '.eslintrc.js' && templateDir === 'vite/linting' && 
          !userPreferences.useTypeScript && fs.existsSync(path.join(sourceDir, '.eslintrc.js.non-ts'))) {
        return fs.copy(path.join(sourceDir, '.eslintrc.js.non-ts'), targetPath);
      }
      
      return fs.copy(sourcePath, targetPath);
    }
  }));
}

async function updatePackageJson(targetDir, projectType, userPreferences) {
  const packageJsonPath = path.join(targetDir, 'package.json');
  
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    
    if (packageJson.scripts && packageJson.scripts.prepare === 'husky install') {
      delete packageJson.scripts.prepare;
    }
    
    if (userPreferences.enableLinting) {
      packageJson.scripts = {
        ...packageJson.scripts,
        lint: 'eslint . --ext ts,tsx,js,jsx --report-unused-disable-directives --max-warnings 0',
        'lint:fix': 'eslint . --ext ts,tsx,js,jsx --fix'
      };

      if (packageJson.scripts.format && packageJson.scripts.format.includes("'")) {
        packageJson.scripts.format = packageJson.scripts.format.replace(/'/g, '"');
      }
      
      if (!packageJson.scripts.format) {
        packageJson.scripts.format = 'prettier --write "./**/*.{js,jsx,ts,tsx,css,md,json}"';
      }
    }
    
    if (userPreferences.setupJest) {
      packageJson.scripts = {
        ...packageJson.scripts,
        test: 'jest',
        'test:watch': 'jest --watch',
        'test:coverage': 'jest --coverage'
      };
    }
    
    if (userPreferences.setupHusky) {
      packageJson['lint-staged'] = {
        '*.{js,jsx,ts,tsx}': [
          'eslint --fix',
          'prettier --write'
        ],
        '*.{md,json}': [
          'prettier --write'
        ]
      };
      
    }
    
    const projectTypeDir = path.join(__dirname, '../templates', projectType);
    const additionsPath = path.join(projectTypeDir, 'package-additions.json');
    
    if (await fs.pathExists(additionsPath)) {
      const additions = await fs.readJson(additionsPath);
      
      packageJson.dependencies = {
        ...packageJson.dependencies,
        ...additions.dependencies
      };
      
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        ...additions.devDependencies
      };
      
      const scriptsFromAdditions = { ...additions.scripts };
      
      if (scriptsFromAdditions.prepare === 'husky install') {
        delete scriptsFromAdditions.prepare;
      }
      
      Object.keys(scriptsFromAdditions).forEach(scriptName => {
        const scriptCommand = scriptsFromAdditions[scriptName];
        if (scriptCommand && scriptCommand.includes("'")) {
          scriptsFromAdditions[scriptName] = scriptCommand.replace(/'/g, '"');
        }
      });
      
      packageJson.scripts = {
        ...packageJson.scripts,
        ...scriptsFromAdditions
      };
    }
    
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }
}

async function setupReadme(targetDir, userPreferences) {
  const readmePath = path.join(__dirname, '../templates/common/README.md');
  const projectReadmePath = path.join(targetDir, 'README.md');
  
  if (fs.existsSync(readmePath)) {
    let readmeContent = await fs.readFile(readmePath, 'utf8');
    const projectName = userPreferences.projectName || path.basename(targetDir);
    readmeContent = readmeContent.replace('# Project Name', `# ${projectName}`);
    
    if (userPreferences.projectType === 'vite') {
      readmeContent = readmeContent.replace(
        'This project was bootstrapped with',
        'This Vite React project was bootstrapped with'
      );
    } else {
      readmeContent = readmeContent.replace(
        'This project was bootstrapped with',
        'This Next.js project was bootstrapped with'
      );
    }
    
    const featuresList = [];
    
    if (userPreferences.useTypeScript) {
      featuresList.push('⚡ TypeScript-enabled build setup');
    } else {
      featuresList.push('⚡ JavaScript-based build setup');
      readmeContent = readmeContent.replace(
        '[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)',
        ''
      );
    }
    
    if (userPreferences.setupJest) {
      featuresList.push('🧪 Jest testing environment');
    } else {
      readmeContent = readmeContent.replace(
        '[![Jest](https://img.shields.io/badge/Jest-Tested-green?logo=jest)](https://jestjs.io/)',
        ''
      );
    }
    
    if (userPreferences.enableLinting) {
      featuresList.push('🔍 ESLint and Prettier for code quality');
    }
    
    if (userPreferences.setupHusky) {
      featuresList.push('🔄 Git hooks with Husky');
    } else {
      readmeContent = readmeContent.replace(
        '[![Husky](https://img.shields.io/badge/Husky-Enabled-yellow?logo=git)](https://typicode.github.io/husky/)',
        ''
      );
    }
    
    if (userPreferences.setupGithubActions) {
      featuresList.push('👷 CI/CD GitHub workflows');
    } else {
      readmeContent = readmeContent.replace(
        '[![CI/CD](https://img.shields.io/badge/CI/CD-GitHub_Actions-white?logo=github-actions)](https://github.com/features/actions)',
        ''
      );
    }
    
    if (userPreferences.setupSnyk) {
      featuresList.push('🛡️ Snyk security scanning');
    }
    
    if (userPreferences.deploymentPlatform !== 'none') {
      featuresList.push(`🚀 Optimized for deployment on ${userPreferences.deploymentPlatform}`);
    }
    
    const featuresRegex = /## 📋 Features\\n\\n(- .*$\\n)+/;
    const featuresReplacement = `## 📋 Features\\n\\n${featuresList.map(f => `- ${f}`).join('\\n')}\\n`;
    readmeContent = readmeContent.replace(featuresRegex, featuresReplacement);
    
    let structureContent = `\\n.
├── node_modules/
`;

    if (userPreferences.projectType === 'nextjs') {
      structureContent += `├── pages/
├── public/
`;
    } else {
      structureContent += `├── public/
├── src/
`;
    }

    if (userPreferences.enableLinting) {
      structureContent += `├── .eslintrc.js
├── .prettierrc
`;
    }

    if (userPreferences.setupJest) {
      structureContent += `├── jest.config.js
`;
    }

    if (userPreferences.setupHusky) {
      structureContent += `├── .husky/
`;
    }
    
    if (userPreferences.setupGithubActions) {
      structureContent += `├── .github/
`;
    }

    structureContent += `├── .gitignore
├── package.json
├── README.md
`;

    if (userPreferences.useTypeScript) {
      structureContent += `└── tsconfig.json
`;
    } else {
      structureContent += `└── vite.config.js
`;
    }
    
    const structureRegex = /## 📁 Project Structure\\n\\n```\\n[\\s\\S]*?```/;
    const structureReplacement = `## 📁 Project Structure\\n\\n\\\`\`\`${structureContent}\\\`\`\``;
    readmeContent = readmeContent.replace(structureRegex, structureReplacement);
    
    await fs.writeFile(projectReadmePath, readmeContent, 'utf8');
  }
}

function addAppBoosterSignature(targetDir, userPreferences) {
  const signaturePath = path.join(targetDir, '.appbooster');
  const signatureContent = {
    generator: 'create-app-booster',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    settings: {
      projectType: userPreferences.projectType,
      language: userPreferences.useTypeScript ? 'typescript' : 'javascript',
      features: {
        serviceWorker: userPreferences.useServiceWorker,
        linting: userPreferences.enableLinting,
        testing: userPreferences.setupJest,
        githubActions: userPreferences.setupGithubActions,
        snyk: userPreferences.setupSnyk,
        git: userPreferences.initGit,
        husky: userPreferences.setupHusky
      }
    }
  };
  
  return fs.writeJson(signaturePath, signatureContent, { spaces: 2 });
}

program.parse(process.argv);