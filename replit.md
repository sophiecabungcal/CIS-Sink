# Sink

## Overview

Sink is a food waste reduction application that helps users track their pantry inventory, monitor expiration dates, get AI-powered recipe suggestions based on available ingredients, and visualize their food waste statistics. The app is built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence.

## Brand Colors
- **Yellow** (#FBDB93): Main page backgrounds (Pantry, Recipes, Stats, Add Item details page)
- **Coral** (#BE5B50): Login page background, Add Item selection page background, accent buttons
- **Maroon** (#641B2E): Text accents and focus borders
- **White**: Form fields, search bars, item cards for consistency across pages

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Charts**: Recharts for data visualization (waste statistics pie charts)
- **Build Tool**: Vite with hot module replacement

The frontend follows a page-based architecture with custom hooks for data fetching (`use-pantry.ts`, `use-recipes.ts`, `use-stats.ts`). Components are organized into UI primitives (shadcn/ui) and feature-specific components.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth via OpenID Connect (OIDC) with Passport.js
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **AI Integration**: OpenAI API (via Replit AI Integrations) for recipe suggestions

The backend uses a storage layer pattern (`server/storage.ts`) that abstracts database operations. Routes are defined in `server/routes.ts` with a shared API contract (`shared/routes.ts`) using Zod schemas for type-safe request/response validation.

### Data Model
- **users**: Authenticated users (managed by Replit Auth)
- **sessions**: Session storage for authentication
- **items**: Reference catalog of food and household items with default shelf life and `itemType` (food/household)
- **pantryItems**: User's pantry inventory with quantity, expiration, and status tracking
- **savedRecipes**: User's saved recipes with title, ingredients, instructions, prep time, difficulty, and source name

### API Design
The API follows RESTful conventions with a typed contract in `shared/routes.ts`:
- `GET/POST /api/pantry` - List and create pantry items
- `PATCH/DELETE /api/pantry/:id` - Update and delete pantry items
- `GET /api/items` - Reference item catalog
- `POST /api/recipes/suggest` - AI-powered recipe suggestions (accepts `count` and `excludeTitles` parameters)
- `GET /api/stats` - Comprehensive user statistics with time periods (all-time, week, month, 3 months)
- `GET /api/saved-recipes` - List user's saved recipes
- `POST /api/saved-recipes` - Save a recipe
- `DELETE /api/saved-recipes/:id` - Unsave a recipe
- `GET /api/saved-recipes/check` - Check if a recipe is saved by title

### Smart Recipes Feature
The Smart Recipes feature uses GPT-4o to generate personalized recipe suggestions:
- **General mode**: Generates up to 10 diverse recipes using items from the user's pantry
- **Custom mode**: Users can select specific pantry items (1-10) to generate targeted recipes that use those ingredients
- **Household Recipes**: When users have household items in pantry (vinegar, baking soda, etc.), a toggle appears to include DIY household/cleaning recipes (cleaners, air fresheners, pest repellents)
- **Find More**: Users can request 5 additional recipes, excluding previously suggested ones
- **Recipe Detail Page**: Shows full recipe with ingredients, step-by-step instructions, prep time, difficulty, and source attribution (text-only, no links due to AI URL limitations)
- **Save/Unsave**: Users can save recipes by clicking the bookmark icon on recipe cards or detail page
- **Recipe Types**: Recipes have a `recipeType` field ("food" or "household") and household recipes display with a coral "Household" badge
- **Routes**: `/recipes` (suggestions list), `/recipes/custom` (item selection), `/recipes/detail` (recipe details)
- **State Management**: Selected recipe and custom item IDs are passed via React state from App.tsx

### Saved Recipes Feature
Users can save and manage their favorite recipes:
- **Saved Recipes Page** (`/saved-recipes`): Displays all saved recipes as cards
- **Search**: Filter recipes by title search
- **Filters**: Filter by difficulty (Easy/Medium/Hard) and prep time (Quick/Medium/Long)
- **Sort Options**: Sort by title (A-Z, Z-A) or recently saved
- **Recipe Detail**: Clicking a saved recipe opens the detail view
- **Unsave**: Remove recipes from saved list with the bookmark icon
- **Navigation**: Accessible via "Saved" icon in the bottom navbar
- **State Management**: Uses `use-saved-recipes.ts` hook with TanStack Query

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, provisioned via Replit
- **Drizzle Kit**: Database migrations with `db:push` command

### Authentication
- **Replit Auth**: OIDC-based authentication requiring `REPL_ID` and `SESSION_SECRET` environment variables
- **Session Management**: PostgreSQL-backed sessions with 1-week TTL

### AI Services
- **OpenAI API**: Used for recipe suggestions via Replit AI Integrations
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Third-Party Libraries
- **date-fns**: Date manipulation and formatting
- **zod**: Runtime type validation and schema definition
- **drizzle-zod**: Generates Zod schemas from Drizzle table definitions

### Development Tools
- **Vite Plugins**: Replit-specific plugins for development (cartographer, dev-banner, runtime-error-modal)
- **esbuild**: Production server bundling with dependency allowlist optimization