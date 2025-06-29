# Aeturnis Online - Text-Based MMORPG

## Project Overview
A classic text-based MMORPG with infinite progression, racial diversity, and affinity-based combat systems. Built following systematic phase-based development approach from Phases.md specifications.

## Current Status
- **Phase 1 (Complete Framework & Basic Interface)**: ✅ COMPLETED
- **Phase 2.1 Race System Implementation**: ✅ COMPLETED
- **Implementation**: Full race system with abilities, bonuses, and enhanced character creation
- **Server Status**: Running successfully on port 5000
- **Database**: PostgreSQL with enhanced race system, abilities, and equipment framework

## Architecture Overview

### Backend Structure
- Express.js server with comprehensive middleware stack
- PostgreSQL database with relational schema design
- Authentication system with session management
- Rate limiting and security hardening
- Modular route organization (auth, game, admin)

### Frontend Structure
- EJS templating with dark theme matching UIMOCKUP.png
- Responsive grid-based game interface
- Character creation with race selection
- Game dashboard with stats, inventory, and chat
- Mobile-responsive design

### Database Schema
- Complete user management with authentication
- 8 unique races with stat modifiers and starting zones
- Character system with infinite level progression
- Weapon affinity tracking (7 weapon types)
- Magic affinity tracking (8 magic schools)
- Session management and chat systems
- Admin action logging

## Phase 2.1 Race System Implementation Complete

### ✅ Enhanced Race System
- 8 races with comprehensive stat modifiers and bonuses
- 17 unique race abilities (active and passive types)
- Experience bonuses: Human +10%, Dragonborn -25%
- Affinity bonuses: Elf magic +20%, Dwarf weapon +20%
- Race-specific starting zones and equipment restrictions

### ✅ Race Ability System
- Active abilities with cooldowns and mana costs
- Passive abilities with continuous effects
- Real-time cooldown tracking and management
- Dynamic ability loading in game interface
- Interactive ability usage with visual feedback

### ✅ Advanced Character Creation
- Detailed race information display
- Stat modifiers, bonuses, and abilities shown
- Color-coded sections for easy comparison
- Enhanced visual hierarchy matching UIMOCKUP.png
- Starting zone information for each race

### ✅ API & Frontend Integration
- `/api/abilities/race-abilities/:characterId` endpoint
- `/api/abilities/use-ability` for ability execution
- AJAX-based ability loading and usage
- Real-time UI updates for cooldowns
- Comprehensive error handling and validation

### ✅ Database Enhancement
- race_abilities table with 17 abilities
- character_ability_cooldowns tracking system
- race_equipment_restrictions framework
- Enhanced races table with 6 new columns
- JSONB effect data for flexible ability mechanics

## Phase 1 Implementation Complete

### ✅ Repository Structure
- `/src/` - Backend application logic
- `/views/` - EJS templates organized by feature
- `/public/` - Static assets (CSS, JavaScript)
- Complete file organization following Phases.md

### ✅ Technology Stack
- Node.js 20 with Express.js framework
- PostgreSQL for persistent data storage
- EJS templating engine for server-side rendering
- bcrypt for password security
- Comprehensive middleware stack (helmet, cors, rate limiting)

### ✅ Database Schema
- 8 tables with proper relationships and constraints
- Default races populated with lore-appropriate stats
- Affinity tracking systems for weapons and magic
- Session management and audit logging

### ✅ Authentication System
- Registration with validation and uniqueness checks
- Login with password hashing and session management
- "Remember me" functionality with extended sessions
- Admin role separation with protected routes

### ✅ Game Interface (Based on UIMOCKUP.png)
- Dark terminal-style theme with green text
- Grid layout with character panel, game text, and sidebar
- Equipment grid, inventory system, and skills display
- Movement controls and action buttons
- Multi-channel chat system with tabs

### ✅ Admin Panel
- Dashboard with server statistics
- User and character management interfaces
- Chat monitoring and server broadcast capabilities
- Action logging for administrative oversight

### ✅ Configuration & Deployment
- Environment configuration with security best practices
- Replit workflow integration with port 5000
- Error handling and 404 pages
- Proxy configuration for production deployment

## User Preferences
- Communication style: Simple, everyday language
- Systematic implementation following Phases.md
- Reference UIMOCKUP.png for UI design decisions

## Recent Changes
- June 29, 2025: Phase 2.1 Race System Implementation completed
- Enhanced race system with abilities, bonuses, and equipment restrictions
- 17 race abilities implemented across all 8 races (active and passive)
- Advanced character creation interface with detailed race information
- Dynamic race ability system with cooldowns and mana costs
- API integration for ability usage and management
- Equipment restriction framework prepared for future phases
- Server successfully running with enhanced race mechanics