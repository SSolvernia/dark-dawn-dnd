# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application using React 19, Tailwind CSS v4, and the React Compiler. The project is called "dark-dawn-dnd" and follows the Next.js App Router architecture.

## Development Commands

### Running the Development Server
```bash
npm run dev
```
- Starts the Next.js development server with webpack
- Server runs on http://localhost:3000
- Hot reload is enabled for all changes

### Building for Production
```bash
npm run build
```
- Creates an optimized production build using webpack
- Must succeed before deployment

### Starting Production Server
```bash
npm start
```
- Runs the production server (requires `npm run build` first)

### Linting
```bash
npm run lint
```
- Runs ESLint to check for code quality issues
- Configuration in `eslint.config.mjs`

## Architecture

### Technology Stack
- **Framework**: Next.js 16.0.1 with App Router
- **React**: 19.2.0 with React Compiler enabled
- **Styling**: Tailwind CSS v4 (using new `@tailwindcss/postcss` plugin)
- **JavaScript**: Modern ES modules (.mjs config files)
- **Font Loading**: Next.js font optimization with Geist fonts

### Project Structure
```
src/
  app/              # Next.js App Router directory
    layout.js       # Root layout with font configuration
    page.js         # Homepage component
    globals.css     # Global styles and Tailwind setup
    favicon.ico
public/             # Static assets
```

### Key Configuration Details

**React Compiler**
- Enabled in `next.config.mjs` with `reactCompiler: true`
- Automatically optimizes React components at build time
- Babel plugin configured in `devDependencies`

**Webpack**
- Both dev and build scripts use `--webpack` flag explicitly
- This is intentional and should not be removed

**Path Aliases**
- `@/*` maps to `./src/*` (configured in `jsconfig.json`)
- Use `@/` prefix for all imports from src directory

**Tailwind CSS v4**
- Uses the new `@import "tailwindcss"` syntax in `globals.css`
- Theme configuration uses `@theme inline` directive
- PostCSS configured with `@tailwindcss/postcss` plugin

**Fonts**
- Geist Sans and Geist Mono loaded via `next/font/google`
- CSS variables: `--font-geist-sans` and `--font-geist-mono`
- Theme mapping in `globals.css` exposes these as `--font-sans` and `--font-mono`

**Color Scheme**
- CSS custom properties for `--background` and `--foreground`
- Dark mode via `prefers-color-scheme` media query
- Theme variables available in Tailwind config

### ESLint Configuration
- Uses Next.js core-web-vitals config
- Flat config format with `defineConfig` and `globalIgnores`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Important Notes

- The project uses webpack explicitly (not Turbopack) - preserve the `--webpack` flags in package.json scripts
- Tailwind CSS v4 has a different syntax than v3 - use `@import "tailwindcss"` and `@theme inline` directives
- React Compiler is experimental but enabled - be aware it may affect component behavior
- All page components use the App Router conventions (not Pages Router)
