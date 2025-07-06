# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `yarn dev` - Start development mode with Vite
- `yarn build` - Build the extension (runs TypeScript compilation + Vite build)
- `yarn lint` - Run ESLint to check code quality
- `yarn zip` - Create a distributable extension zip file from the built dist folder

## Architecture Overview

This is a Chrome Extension (Manifest V3) called **Selection Command** that allows users to perform various actions on selected text on web pages.

### Key Components

**Chrome Extension Structure:**

- `manifest.json` - Extension manifest defining permissions, content scripts, and background workers
- `src/background_script.ts` - Service worker handling extension lifecycle and background operations
- `src/content_script.tsx` - Main content script injected into web pages
- `src/options_page.tsx` - Extension options/settings page

**Core Architecture:**

- **Actions** (`src/action/`) - Core functionality modules including background operations, popup handling, page actions, and command execution
- **Components** (`src/components/`) - React components organized by feature:
  - `menu/` - Context menu and menu item components
  - `option/` - Settings and configuration UI
  - `pageAction/` - Page automation and recording components
  - `result/` - Result display and popup components
  - `ui/` - Reusable UI components (uses Radix UI)
- **Services** (`src/services/`) - Business logic and utilities including settings management, storage, analytics, and page action handling
- **Hooks** (`src/hooks/`) - Custom React hooks for state management and Chrome extension APIs

**Key Features:**

- **Page Actions** - Record and replay browser automation sequences
- **Command Hub** - Web interface for sharing and discovering commands (separate Next.js app in `pages/`)
- **Context Menus** - Right-click actions on selected text
- **Settings Management** - Import/export configurations and user preferences

### Technical Stack

- **Frontend**: React 18 with TypeScript
- **Build System**: Vite with `@crxjs/vite-plugin` for Chrome extension development
- **UI Components**: Shadcn
- **Form and Validation**: react-hook-form and zod
- **Styling**: CSS Modules + Tailwind CSS(ver.3)
- **State Management**: React hooks with Chrome extension storage APIs
- **Testing**: ESLint for code quality

### Project Structure Notes

- The main extension code is in `src/`
- The command hub website is a separate Next.js application in `pages/`
- Extension supports internationalization with locale files in `public/_locales/`
- Uses Shadow DOM for content script styling isolation
- Implements Robula+ algorithm for robust XPath selector generation (`src/lib/robula-plus/`)
