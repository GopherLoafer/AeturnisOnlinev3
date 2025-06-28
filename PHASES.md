# MMORPG Replit Implementation Plan - Progressive Build Guide

## Table of Contents
- [Phase 1: Foundation & Setup](#phase-1-foundation--setup)
- [Phase 2: Authentication & Users](#phase-2-authentication--users)
- [Phase 3: Character System](#phase-3-character-system)
- [Phase 4: Game World & Movement](#phase-4-game-world--movement)
- [Phase 5: Combat & Progression](#phase-5-combat--progression)
- [Phase 6: Economy & Items](#phase-6-economy--items)
- [Phase 7: Social Features](#phase-7-social-features)
- [Phase 8: Polish & Launch](#phase-8-polish--launch)
- [Admin Tools Summary](#admin-tools-summary)
- [Development Timeline](#development-timeline)
- [Key Dependencies](#key-dependencies-between-phases)
- [Development Tips](#development-tips)
- [Success Metrics](#success-metrics)

**Note:** This plan includes comprehensive admin tools and systems integrated throughout each phase. Admin features are built alongside player features to ensure proper game management from day one.

---

## Admin Tools Summary

### Core Admin Systems Implemented

**Authentication & Access (Phase 2)**
- Role-based access control (player/moderator/admin)
- Admin-only endpoints and middleware
- Secure admin panel access

**Player Management (Phase 2-3)**
- User account controls (ban/unban, role changes)
- Character editing and monitoring
- Activity tracking and history
- Bulk player operations

**World Control (Phase 4)**
- Zone management and settings
- Player teleportation
- Zone announcements
- World statistics and monitoring

**Game Balance (Phase 5)**
- Combat monitoring and intervention
- Monster spawning and editing
- Damage formula adjustments
- Loot table management

**Economy Management (Phase 6)**
- Gold/item creation and removal
- Market monitoring and controls
- Trade surveillance
- Price inflation tools

**Moderation (Phase 7)**
- Chat monitoring and logging
- Mute/ban systems
- Report queue management
- Guild administration

**Analytics & Monitoring (Phase 8)**
- Master dashboard with real-time stats
- Performance monitoring
- Error tracking and logs
- Server control panel

### Admin Command Reference
```
/admin teleport [player] [x] [y] [zone]
/admin give [player] [item] [quantity]
/admin setlevel [player] [level]
/admin ban [player] [duration] [reason]
/admin mute [player] [duration]
/admin announce [message]
/admin spawn [monster] [x] [y]
/admin event start [event_name]
/admin server restart [minutes]
/admin backup create
```

### Admin Interface Design Guidelines
- **Separate Admin UI**: Keep admin tools visually distinct from player interface
- **Confirmation Dialogs**: Require confirmation for destructive actions
- **Action Logging**: Show recent admin actions in the interface
- **Quick Access**: Hotkeys for common admin tasks
- **Mobile Support**: Ensure admin tools work on mobile for emergency access
- **Search Everything**: Add search to all admin lists (players, items, etc.)
- **Bulk Operations**: Allow selecting multiple items for efficiency
- **Undo Options**: Provide undo for reversible actions

### Recommended Admin Team Structure
1. **Head Admin** (1-2 people)
   - Full access to all systems
   - Server restart capabilities
   - Economy controls
   - Database access

2. **Game Masters** (3-5 people)
   - Player support tools
   - Character/item management
   - Event controls
   - Combat monitoring

3. **Moderators** (5-10 people)
   - Chat moderation
   - Basic mute/kick powers
   - Report handling
   - Community management

4. **Support Staff** (as needed)
   - Read-only access
   - Help players
   - Escalate issues
   - Documentation updates

### Admin Security Best Practices
- **Separate Admin Accounts**: Admins should have separate player accounts
- **Two-Factor Authentication**: Require 2FA for all admin accounts
- **IP Whitelisting**: Restrict admin panel access to known IPs
- **Action Audit Logs**: Log every admin action with timestamp and reason
- **Regular Audits**: Review admin actions weekly
- **Principle of Least Privilege**: Give minimum necessary permissions
- **Time-Limited Access**: Rotate admin credentials regularly
- **Emergency Procedures**: Have a plan for compromised admin accounts

---

## Phase 1: Foundation & Setup
*Build the basic project structure and server*

### Phase 1A: Replit Setup
1. **Environment Configuration**
   - Create `.env` file (use Replit Secrets)
   - Add `JWT_SECRET` (generate random string)
   - Add `PORT=3000`
   - Add `NODE_ENV=development`
   - Add `SESSION_SECRET` (another random string)

2. **Project Structure**
   ```
   /
   ├── backend/
   │   ├── src/
   │   │   ├── server.js
   │   │   ├── routes/
   │   │   ├── middleware/
   │   │   ├── models/
   │   │   └── utils/
   │   └── data/
   ├── frontend/
   │   ├── public/
   │   └── src/
   ├── shared/
   └── package.json
   ```

### Phase 1B: Basic Server Setup
1. **Install Core Dependencies**
   ```bash
   npm init -y
   npm install express cors helmet
   npm install -D nodemon
   ```

2. **Create Basic Express Server**
   - Set up Express app
   - Add security middleware (helmet)
   - Enable CORS
   - Create health check endpoint
   - Add error handling
   - Set up static file serving

3. **Database Setup**
   - Use Replit's built-in database
   - Create database wrapper functions
   - Set up data file structure
   - Create backup system using JSON files

### Phase 1C: Frontend Foundation
1. **Basic HTML Structure**
   - Create index.html
   - Add CSS framework (or custom styles)
   - Set up responsive layout
   - Create loading screen

2. **JavaScript Foundation**
   - Set up module system
   - Create API client
   - Add error handling
   - Create utility functions

3. **Initial UI Components**
   - Login/Register forms
   - Main game container
   - Error message display
   - Loading indicators

**Phase 1 Deliverables:**
- Working Express server
- Basic frontend that connects to server
- Database connection established
- Project structure ready for development

---

## Phase 2: Authentication & Users
*Build secure user system with JWT tokens and admin roles*

### Phase 2A: User Registration
1. **Backend Registration**
   - Install bcrypt for password hashing
   - Create user model/schema
   - Validate username (3-20 chars, alphanumeric)
   - Validate password (8+ chars, complexity)
   - Check username uniqueness
   - Hash password before storage
   - Create user in database
   - Add role field (player/moderator/admin)

2. **Registration API Endpoint**
   ```
   POST /api/auth/register
   - Validate input
   - Check existing user
   - Create new user
   - Default role: 'player'
   - Return success message
   ```

3. **Frontend Registration**
   - Create registration form
   - Client-side validation
   - Error display
   - Success redirect to login

### Phase 2B: JWT Authentication
1. **Install JWT Package**
   ```bash
   npm install jsonwebtoken
   ```

2. **Login System**
   - Create login endpoint
   - Verify username/password
   - Generate JWT token (15 min expiry)
   - Include role in JWT payload
   - Generate refresh token (7 days)
   - Store refresh token in database
   - Return both tokens to client

3. **Token Management**
   - Create auth middleware
   - Create admin middleware
   - Verify JWT on protected routes
   - Check role permissions
   - Implement token refresh endpoint
   - Handle token expiration
   - Add logout functionality

### Phase 2C: Session Management & Admin Access
1. **Frontend Token Handling**
   - Store tokens securely (memory/sessionStorage)
   - Add token to API requests
   - Handle token refresh automatically
   - Clear tokens on logout
   - Detect admin role for UI changes

2. **Protected Routes**
   - Create middleware to verify JWT
   - Create admin-only middleware
   - Protect game endpoints
   - Protect admin endpoints
   - Handle unauthorized access
   - Redirect to login when needed

3. **User Profile & Admin Panel**
   - Create profile endpoint
   - Display user information
   - Allow username viewing
   - Track last login time
   - Create admin panel route
   - Show admin navigation

4. **Admin User Management**
   ```
   GET /api/admin/users (list all users)
   PUT /api/admin/users/:id/role (change role)
   PUT /api/admin/users/:id/ban (ban/unban user)
   GET /api/admin/users/:id/activity (view activity)
   ```

**Phase 2 Deliverables:**
- Secure registration system
- JWT-based authentication with roles
- Protected API endpoints
- User session management
- Basic admin panel access

---

## Phase 3: Character System
*Create character creation and management with admin tools*

### Phase 3A: Character Creation
1. **Character Model**
   - Link characters to users
   - One character per account (initially)
   - Character properties:
     - Name (unique)
     - Class (Warrior/Mage/Rogue)
     - Level (start at 1)
     - Stats (STR, DEX, INT, VIT)
     - Starting location
     - Created timestamp
     - Last active timestamp

2. **Creation Process**
   - Check if user has character
   - Validate character name
   - Assign starting stats by class
   - Give starter equipment
   - Place in tutorial zone
   - Log character creation

3. **Character API**
   ```
   POST /api/character/create
   GET /api/character/my-character
   GET /api/character/stats
   ```

### Phase 3B: Character Display & Management
1. **Character Sheet UI**
   - Show character name/class
   - Display level and XP
   - Show all stats
   - Display equipment slots
   - Show character status
   - Display play time

2. **Stat System**
   - Base stats by class
   - Stat growth per level
   - Equipment stat bonuses
   - Temporary buffs/debuffs
   - Admin stat overrides

3. **Character Persistence**
   - Auto-save character data
   - Track character actions
   - Store position/state
   - Handle disconnections
   - Activity logging

### Phase 3C: Character Progression & Admin Tools
1. **Experience System**
   - XP from activities
   - Level up calculations
   - Stat point allocation
   - Unlock new abilities
   - Admin XP commands

2. **Character API Expansion**
   ```
   PUT /api/character/allocate-stats
   GET /api/character/abilities
   ```

3. **Admin Character Management**
   ```
   GET /api/admin/characters (list all characters)
   GET /api/admin/characters/:id (view character details)
   PUT /api/admin/characters/:id/level (set level)
   PUT /api/admin/characters/:id/stats (modify stats)
   PUT /api/admin/characters/:id/location (teleport)
   DELETE /api/admin/characters/:id (delete character)
   POST /api/admin/characters/:id/give-item (give items)
   GET /api/admin/characters/online (view online players)
   ```

4. **Admin Character Tools UI**
   - Character search interface
   - Live character monitoring
   - Character edit forms
   - Action history viewer
   - Bulk operations
   - Character restore tools

**Phase 3 Deliverables:**
- Character creation system
- Character display/management
- Basic progression mechanics
- Persistent character data
- Complete admin character tools

---

## Phase 4: Game World & Movement
*Create the game world and movement system with admin controls*

### Phase 4A: Zone System
1. **Zone Data Structure**
   - Create zones in JSON files
   - Zone properties:
     - ID and name
     - Size (20x20 grid)
     - Level range
     - Connections to other zones
     - Safe zone flag
     - PvP enabled flag
     - Admin-only flag

2. **Initial Zones**
   - Tutorial Island (1-5)
   - Starter Town (safe zone)
   - Forest Path (5-10)
   - Dark Woods (10-15)
   - Mountain Pass (15-20)
   - Admin Zone (admin only)

3. **Zone Loading**
   - Load zone data on server start
   - Cache active zones
   - Handle zone transitions
   - Zone access permissions

### Phase 4B: Movement System & Monitoring
1. **Position Tracking**
   - Track player X,Y coordinates
   - Validate movement requests
   - Check boundaries
   - Update position in database
   - Log movement patterns

2. **Movement API**
   ```
   POST /api/game/move
   GET /api/game/location
   GET /api/game/nearby-players
   ```

3. **Movement UI**
   - Direction buttons (N,S,E,W)
   - Show current location
   - Display location description
   - Mini-map display
   - Coordinate display for admins

### Phase 4C: Real-time Updates & Admin Tools
1. **Socket.io Setup**
   ```bash
   npm install socket.io socket.io-client
   ```

2. **Live Updates**
   - Connect on login
   - Join zone rooms
   - Broadcast movements
   - Show other players
   - Update positions live
   - Admin spectator mode

3. **Zone Population & Management**
   - Show players in zone
   - Update on enter/leave
   - Display player count
   - "Who's here" list
   - Zone capacity limits

4. **Admin World Management**
   ```
   GET /api/admin/zones (list all zones)
   GET /api/admin/zones/:id/players (players in zone)
   POST /api/admin/zones/:id/announce (zone announcement)
   PUT /api/admin/zones/:id/settings (modify zone)
   POST /api/admin/zones/:id/clear (remove all players)
   POST /api/admin/teleport (teleport player)
   GET /api/admin/world/overview (world statistics)
   ```

5. **Admin World Tools UI**
   - Zone monitoring dashboard
   - Player location map
   - Zone settings editor
   - Mass teleport tools
   - Zone event triggers
   - Heat map of player activity

**Phase 4 Deliverables:**
- Working zone system
- Movement mechanics
- Real-time player positions
- Zone transitions
- Complete admin world tools
- Zone monitoring dashboard

---

## Phase 5: Combat & Progression
*Implement combat system and character growth with admin controls*

### Phase 5A: Combat Basics
1. **Combat Initiation**
   - Random encounters
   - Player challenges
   - Combat state tracking
   - Turn-based system
   - Combat logging

2. **Monster System**
   - Create monster data files
   - Spawn monsters in zones
   - Monster stats by level
   - Loot tables
   - Respawn timers
   - Admin spawn controls

3. **Combat API**
   ```
   POST /api/combat/start
   POST /api/combat/attack
   POST /api/combat/flee
   GET /api/combat/status
   ```

### Phase 5B: Combat Mechanics & Balance
1. **Damage Calculation**
   - Basic formula using stats
   - Hit/miss chances
   - Critical strikes
   - Damage ranges
   - Admin damage modifiers

2. **Combat Flow**
   - Display combat UI
   - Show health bars
   - Action buttons
   - Combat log
   - Victory/defeat handling
   - Admin intervention options

3. **Combat Rewards**
   - Experience points
   - Gold drops
   - Item drops
   - Level up notifications
   - Admin reward overrides

### Phase 5C: Skills & Admin Tools
1. **Skill System**
   - Class-specific skills
   - Skill unlocks by level
   - Cooldown timers
   - Mana/stamina costs
   - Admin skill grants

2. **Skill Implementation**
   - Damage skills
   - Healing abilities
   - Buff/debuff effects
   - Special attacks
   - Admin-only skills

3. **Admin Combat Management**
   ```
   GET /api/admin/combat/active (view all combats)
   GET /api/admin/combat/:id (view combat details)
   POST /api/admin/combat/:id/end (force end combat)
   PUT /api/admin/monsters/:id (edit monster stats)
   POST /api/admin/monsters/spawn (spawn monster)
   DELETE /api/admin/monsters/:id (remove monster)
   GET /api/admin/combat/logs (combat history)
   PUT /api/admin/balance/damage (adjust formulas)
   ```

4. **Admin Combat Tools UI**
   - Combat monitoring dashboard
   - Real-time combat viewer
   - Monster editor interface
   - Loot table editor
   - Damage formula tester
   - Balance adjustment panel
   - Combat statistics viewer

**Phase 5 Deliverables:**
- Complete combat system
- Monster encounters
- Skill/ability system
- Character progression
- Admin combat controls
- Balance testing tools

---

## Phase 6: Economy & Items
*Create items, inventory, and economy with admin controls*

### Phase 6A: Item System
1. **Item Database**
   - Create item definitions
   - Item properties:
     - Name, description
     - Type (weapon/armor/consumable)
     - Stats/effects
     - Value
     - Rarity
     - Admin-only flag

2. **Inventory Management**
   - Inventory slots (start with 20)
   - Stack similar items
   - Weight limits
   - Item sorting
   - Admin unlimited inventory

3. **Item API**
   ```
   GET /api/inventory
   POST /api/inventory/use
   POST /api/inventory/equip
   DELETE /api/inventory/drop
   ```

### Phase 6B: Equipment System & Trading
1. **Equipment Slots**
   - Weapon
   - Helmet
   - Chest
   - Gloves
   - Boots
   - Accessories
   - Admin equipment viewer

2. **Equipment Effects**
   - Stat bonuses
   - Special properties
   - Set bonuses
   - Visual indicators
   - Admin stat overrides

3. **Player Trading**
   - Trade requests
   - Trade window
   - Confirmation system
   - Trade history
   - Admin trade monitoring

### Phase 6C: Economy & Admin Tools
1. **Shop System**
   - NPC vendors
   - Buy/sell interface
   - Dynamic pricing
   - Limited stock items
   - Admin price controls

2. **Currency Management**
   - Gold tracking
   - Earn from combat
   - Spend at shops
   - Player-to-player transfers
   - Admin gold commands

3. **Admin Economy Management**
   ```
   GET /api/admin/economy/overview (economy statistics)
   GET /api/admin/economy/richest (top gold holders)
   POST /api/admin/economy/gold (give/remove gold)
   GET /api/admin/items (list all items)
   POST /api/admin/items (create new item)
   PUT /api/admin/items/:id (edit item)
   DELETE /api/admin/items/:id (delete item)
   GET /api/admin/trades (monitor trades)
   POST /api/admin/shops/restock (force restock)
   PUT /api/admin/economy/inflation (adjust prices)
   ```

4. **Admin Economy Tools UI**
   - Economy dashboard
   - Gold circulation graphs
   - Item distribution charts
   - Trade monitoring panel
   - Item editor interface
   - Price adjustment tools
   - Market manipulation alerts

**Phase 6 Deliverables:**
- Complete inventory system
- Equipment mechanics
- NPC shops
- Player trading
- Admin economy controls
- Market monitoring tools

---

## Phase 7: Social Features
*Add multiplayer and social elements with moderation tools*

### Phase 7A: Chat System
1. **Chat Implementation**
   - Real-time messaging
   - Multiple channels:
     - Global
     - Zone
     - Whisper
     - Party
     - Admin (admin only)

2. **Chat Features**
   - Message history
   - User mentions
   - Emotes
   - Chat commands
   - Admin commands

3. **Moderation**
   - Basic word filter
   - Mute functionality
   - Report system
   - Chat logs
   - Admin overrides

### Phase 7B: Friends & Groups
1. **Friend System**
   - Add/remove friends
   - Online status
   - Friend locations
   - Quick messaging
   - Block list

2. **Party System**
   - Create/join parties
   - Shared experience
   - Party chat
   - Group activities
   - Admin party monitoring

3. **Guild Basics**
   - Create guilds
   - Join/leave
   - Guild chat
   - Member list
   - Admin guild management

### Phase 7C: Leaderboards & Admin Tools
1. **Leaderboards**
   - Top players by level
   - Richest players
   - PvP rankings
   - Guild rankings
   - Admin exclusions

2. **Events System**
   - Daily login bonus
   - Weekend events
   - Special spawns
   - Limited-time content
   - Admin event controls

3. **Admin Social Management**
   ```
   GET /api/admin/chat/logs (view chat history)
   POST /api/admin/chat/mute (mute player)
   DELETE /api/admin/chat/message/:id (delete message)
   POST /api/admin/chat/announce (global announcement)
   GET /api/admin/reports (view player reports)
   PUT /api/admin/reports/:id/resolve (handle report)
   POST /api/admin/ban (ban player)
   GET /api/admin/guilds (list all guilds)
   DELETE /api/admin/guilds/:id (disband guild)
   POST /api/admin/events/start (start event)
   PUT /api/admin/events/:id/modify (change event)
   ```

4. **Admin Moderation Tools UI**
   - Chat monitoring dashboard
   - Real-time chat viewer
   - Report queue interface
   - Ban/mute management
   - Player behavior tracking
   - Automated flag system
   - Guild management panel
   - Event control center

**Phase 7 Deliverables:**
- Full chat system
- Social features
- Guild system
- Events and leaderboards
- Complete moderation tools
- Admin communication controls

---

## Phase 8: Polish & Launch
*Final polish, admin dashboard, and launch preparation*

### Phase 8A: Bug Fixing & Balance
1. **Testing Phase**
   - Complete playthrough test
   - Fix critical bugs
   - Balance combat
   - Adjust progression speed
   - Admin testing tools

2. **Performance**
   - Optimize database queries
   - Reduce server load
   - Improve response times
   - Cache frequently used data
   - Monitor performance metrics

3. **Quality of Life**
   - Auto-save improvements
   - Better error messages
   - UI improvements
   - Mobile responsiveness
   - Admin quick fixes

### Phase 8B: Admin Dashboard & Analytics
1. **Master Admin Dashboard**
   - Server health monitoring
   - Player count graphs
   - Active zones heat map
   - Revenue tracking
   - Performance metrics
   - Error rate monitoring

2. **Analytics System**
   ```
   GET /api/admin/analytics/overview
   GET /api/admin/analytics/players
   GET /api/admin/analytics/revenue
   GET /api/admin/analytics/performance
   GET /api/admin/logs/errors
   GET /api/admin/logs/actions
   ```

3. **Admin Control Panel Features**
   - Server restart controls
   - Maintenance mode toggle
   - Backup management
   - Configuration editor
   - Live server stats
   - Player session management
   - Emergency shutdown

4. **Monitoring Tools**
   - Real-time player count
   - Zone population tracking
   - Resource usage graphs
   - Error log viewer
   - Action audit trail
   - Automated alerts

### Phase 8C: Content & Launch
1. **Content Check**
   - 10+ zones ready
   - 50+ monsters
   - 100+ items
   - 20+ quests
   - Admin content tools

2. **Documentation**
   - Player guide
   - Command list
   - FAQ section
   - API documentation
   - Admin manual
   - Moderation guide

3. **Launch Preparation**
   - Final testing
   - Backup systems
   - Monitoring setup
   - Community prep
   - Admin team training
   - Emergency procedures

4. **Admin Launch Tools**
   - Player cap controls
   - Queue management
   - Server scaling
   - Emergency broadcasts
   - Rollback procedures
   - Data recovery tools

**Phase 8 Deliverables:**
- Polished, stable game
- Complete admin dashboard
- Analytics and monitoring
- Full documentation
- Launch-ready with admin controls
- Emergency management tools

---

## Development Timeline

### Week 1-2: Foundation
- Phase 1: Complete server setup and basic frontend

### Week 3-4: Authentication
- Phase 2: JWT authentication, user system, and admin roles

### Week 5-6: Characters
- Phase 3: Character creation, management, and admin tools

### Week 7-8: World Building
- Phase 4: Zones, movement system, and world monitoring

### Week 9-10: Combat
- Phase 5: Combat, progression, and balance tools

### Week 11-12: Economy
- Phase 6: Items, trading, and economy controls

### Week 13-14: Social
- Phase 7: Chat, social features, and moderation tools

### Week 15-16: Launch
- Phase 8: Polish, admin dashboard, and launch

**Note:** Each phase includes both player features and admin tools. Expect admin tools to take 30-40% of development time per phase.

---

## Key Dependencies Between Phases

1. **Phase 1 → Phase 2**: Need server before authentication
2. **Phase 2 → Phase 3**: Need users before characters (admin roles critical here)
3. **Phase 3 → Phase 4**: Need characters before movement
4. **Phase 4 → Phase 5**: Need movement before combat
5. **Phase 5 → Phase 6**: Need combat for item drops
6. **Phase 6 → Phase 7**: Need items before trading
7. **All Phases → Phase 8**: Everything must work before launch

**Critical Admin Dependencies:**
- Admin role system (Phase 2) required for ALL subsequent admin tools
- Admin authentication must be extra secure (separate 2FA recommended)
- Admin actions should be logged from Phase 2 onward
- Each phase's admin tools depend on core feature working first

---

## Development Tips

### Start Simple
- Get basic version working first
- Add features incrementally
- Test each phase thoroughly
- Don't skip ahead

### Use Replit Features
- Built-in database for user data
- File system for game data
- Secrets for sensitive data
- Always-On for 24/7 uptime

### Security First
- Always hash passwords
- Validate all inputs
- Use JWT tokens properly
- Sanitize user content
- Implement role-based access

### Admin Considerations
- Build admin tools alongside features
- Log all admin actions
- Create undo mechanisms
- Test with limited admin accounts
- Document admin procedures

### Community Building
- Start Discord early
- Document everything
- Be transparent
- Listen to feedback
- Train moderators early

---

## Success Metrics

### Player Success Metrics
- Phase 1: Server runs without crashes
- Phase 2: Users can register and login securely
- Phase 3: Characters persist between sessions
- Phase 4: Multiple players see each other move
- Phase 5: Combat is fun and balanced
- Phase 6: Economy doesn't inflate too quickly
- Phase 7: Players interact positively
- Phase 8: 100+ concurrent players stable

### Admin Success Metrics
- Phase 2: Admins can manage user accounts effectively
- Phase 3: Character issues resolved quickly via admin tools
- Phase 4: Zone problems identified and fixed in real-time
- Phase 5: Game balance adjusted without server restart
- Phase 6: Economy monitored and controlled effectively
- Phase 7: Toxic behavior handled within minutes
- Phase 8: Full visibility into game health and performance

Remember: Each phase builds on the previous one. Don't rush ahead - make sure each phase is solid before moving on!