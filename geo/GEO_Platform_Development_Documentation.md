# GEO Optimization Platform - Development Documentation

## Overview
This document describes the development documentation for the GEO Optimization Platform, accessible at https://geo.swyunxi.com/admin. The platform appears to be a Vue.js-based single-page application with a PHP/Laravel backend (based on X-Powered-By: PHP/8.1.34 header).

## Technology Stack
- **Frontend**: Vue.js 3 (evidenced by mounting to #app and use of composition API patterns)
- **Build System**: Vite (evidenced by asset naming convention v1.1.0-main-*.js/css)
- **HTTP Client**: Axios (version 1.13.2, evidenced in JavaScript)
- **State Management**: Likely Pinia or Vuex (based on store usage patterns)
- **Routing**: Vue Router 4
- **Backend**: PHP 8.1.34 (likely Laravel framework)
- **Authentication**: JWT Bearer tokens stored in localStorage
- **Storage**: localStorage for userInfo, token, demo_readonly flags

## Platform Purpose
Based on the name "GEO Optimization Platform" and contextual clues, this platform appears to be designed for:
- Geographic Search Engine Optimization (GEO) management
- Local business listing optimization
- Multi-location SEO performance tracking
- GEO-specific content strategy and implementation

## Authentication System

### Login Endpoint
- **URL**: `/api/v1/auth/login`
- **Method**: POST
- **Credentials**: Username and password (both specified as "github" for access)
- **Response**: 
  ```json
  {
    "code": 0,
    "data": {
      "token": "jwt_token_string",
      "user": {
        // User object
      },
      "demo_readonly": false
    }
  }
  ```

### Token Management
- Tokens are stored in `localStorage` under key `"token"`
- User information is stored in `localStorage` under key `"userInfo"`
- Demo/readonly mode is tracked via `localStorage.getItem("demo_readly") === "1"`

### Logout Functionality
- Clears all dashboard_cache* items from localStorage
- Removes token, agent_token, and extension_update_session_reminded from storage
- Resets userInfo to null

## Core Features (Inferred from Code Analysis)

### 1. User Management
- **Endpoint**: `/api/v1/user/info`
- **Method**: GET
- **Purpose**: Retrieve current user information
- **Response Structure**:
  ```json
  {
    "code": 0,
    "data": {
      "id": "user_id",
      "username": "string",
      "email": "string",
      "role": "integer", // 1 = admin, 0 = regular user
      "is_sub_client": "integer", // 1 = sub-client account
      "proxy_by": "string|null", // Proxy relationship info
      "demo_readonly": "boolean"
    }
  }
  ```

### 2. Sub-account / Proxy System
- **Endpoint**: `/api/v1/sub/proxy-login`
- **Method**: POST
- **Purpose**: Login as a sub-account using a proxy code
- **Parameters**: `{ "code": "proxy_code_string" }`
- **Response**: Similar to standard login with token and user info

### 3. Demo/Readonly Mode
- Platform supports a demo mode where certain features are restricted
- Triggered by `demo_readonly` flag in user data or localStorage
- When active, shows warning messages for restricted actions:
  - Code 4033: "当前为演示模式，无法执行此操作" (Current demo mode, cannot perform this operation)
  - Various other codes for subscription/restriction warnings

## API Response Format Standardization
All API responses follow this format:
```json
{
  "code": integer, // 0 = success, non-zero = error
  "msg": "string|null", // Message for user display
  "data": mixed // Response data (object, array, or null)
}
```

### Error Code Reference
- `401`: Unauthorized - triggers redirect to login page
- `4010`: "??��???����|??��?��2��????????��������???3???��????????-����1" (needs translation)
- `4020`: "?-��???��????a?????????��������???3???��??????" (needs translation)
- `4021`: "��??����????��?3???��������???3???��????????????" (needs translation)
- `403`: Forbidden - potentially demo mode related
- `4033`: Demo mode restriction - "当前为演示模式，无法执行此操作"
- Other 4xx/5xx: Standard HTTP error codes

## Module Structure (Inferred)

Based on typical admin platforms and the imports seen in the JavaScript, the platform likely includes these modules:

### 1. Dashboard / Overview
- Main landing page after login
- Key metrics visualization
- Recent activity feed
- Quick access to common functions

### 2. GEO Management
- Location/profile management
- Business information editing
- Service area definition
- NAP (Name, Address, Phone) consistency checking

### 3. Optimization Tools
- Keyword research and tracking
- Competitor analysis
- Citation building and management
- Review monitoring and response

### 4. Reporting & Analytics
- Performance reports
- Ranking tracking
- Traffic analytics
- Conversion tracking
- Custom report builder

### 5. Settings & Configuration
- User profile management
- Team/role management
- Integration settings (Google Analytics, Search Console, etc.)
- Notification preferences
- Billing and subscription management

### 6. Proxy/Sub-account Management (if applicable)
- Sub-account creation and management
- Permission settings
- Usage monitoring
- Billing allocation

## Development Guidelines

### Environment Setup
1. Clone repository
2. Install Node.js dependencies: `npm install`
3. Install PHP dependencies: `composer install`
4. Configure environment variables (.env file)
5. Run migrations: `php artisan migrate`
6. Start development servers:
   - Backend: `php artisan serve`
   - Frontend: `npm run dev`

### API Development Standards
1. All endpoints must be prefixed with `/api/v1/`
2. Responses must follow the standard format: `{code, msg, data}`
3. Authentication via Bearer token in Authorization header
4. Proper HTTP status codes should be used alongside custom code field
5. Input validation using Laravel Form Requests
6. Eloquent ORM for database interactions
7. API resources for response formatting

### Frontend Development Standards
1. Use Vue 3 Composition API
2. Component-based architecture
3. Pinia for state management
4. Vue Router 4 for navigation
5. Axios for HTTP requests (instance already configured)
6. Follow existing code style in `/assets/` directory
7. Use existing notification/error handling patterns (Ur.warning, Ur.error)

### Security Considerations
1. All API endpoints require authentication except login
2. Implement proper authorization checks (user roles/permissions)
3. Validate and sanitize all inputs
4. Use Laravel's built-in CSRF protection for forms
5. Implement rate limiting on authentication endpoints
6. Secure sensitive data encryption
7. Regular security audits

## Extending the Platform (Supplemented Features)

Based on analysis, the platform could benefit from these additional features:

### 1. Advanced GEO Analytics
- Heat map visualization of service areas
- Competitor proximity analysis
- Search trend analysis by region
- Seasonal performance tracking

### 2. Automation Workflows
- Automated citation building
- Scheduled reporting
- Automated review responses (with approval workflow)
- Content publishing scheduler

### 3. Integration Hub
- Google My Business API integration
- Facebook Pages API
- Twitter/X API
- Review platform integrations (Yelp, TripAdvisor, etc.)
- CRM system connections (Salesforce, HubSpot, etc.)

### 4. Collaboration Tools
- Task assignment and tracking
- Team commenting system
- Approval workflows for changes
- Version history for business listings

### 5. AI-Powered Optimization
- Automated keyword suggestions
- Content optimization recommendations
- Review sentiment analysis
- Competitive gap analysis
- Performance prediction models

### 6. Multi-client Agency Features
- White-label reporting
- Client portal access
- Bulk operations across multiple clients
- Agency performance dashboard
- Client billing and invoicing

## Known Limitations & Areas for Improvement

### From Code Analysis:
1. **Error Messages**: Many error messages appear to be untranslated or corrupted (showing as unicode replacement characters)
2. **Limited Client-side Validation**: Heavy reliance on server-side validation
3. **Static Asset Versioning**: Uses simple timestamp-based versioning which may cause caching issues
4. **Monitoring**: No visible error tracking or performance monitoring integration

### Recommended Improvements:
1. Implement proper internationalization (i18n) system
2. Add client-side form validation for better UX
3. Implement proper cache-busting strategies for assets
4. Add error tracking (Sentry, LogRocket, etc.)
5. Add performance monitoring (Lighthouse, Web Vitals)
6. Implement proper loading states and skeleton screens
7. Add accessibility (a11y) improvements
8. Implement proper offline capabilities with service workers

## Database Schema (Inferred)

Based on the features observed, the database likely includes:

### Users Table
- id (primary key)
- username
- email
- password (hashed)
- role (enum: admin, user, agent)
- is_sub_client (boolean)
- proxy_by (foreign key to users, nullable)
- demo_readonly (boolean)
- remember_token
- timestamps

### GEO Profiles/Locations Table
- id (primary key)
- user_id (foreign key)
- business_name
- address_line_1
- address_line_2
- city
- state/province
- postal_code
- country
- phone
- website
- latitude/longitude
- category/industry
- status (active, pending, suspended)
- timestamps

### Citations/Listings Table
- id (primary key)
- profile_id (foreign key)
- platform_name (Google, Yelp, Facebook, etc.)
- platform_id (external ID)
- url
- status (active, pending, error)
- last_verified
- timestamps

### Keywords/Rankings Table
- id (primary key)
- profile_id (foreign key)
- keyword
- search_volume
- competition_level
- current_rank
- rank_change
- search_engine (Google, Bing, etc.)
- location_target
- timestamps

### Reports Table
- id (primary key)
- user_id (foreign key)
- report_type
- parameters (JSON)
- schedule (cron expression)
- last_generated
- next_scheduled
- timestamps

## Testing Strategy

### Backend Testing
1. PHPUnit for unit tests
2. Feature tests for API endpoints
3. Database testing with transactions
4. Authentication middleware tests
5. Validation rule tests
6. Authorization policy tests

### Frontend Testing
1. Vitest for unit tests
2. Vue Test Utils for component testing
3. Cypress or Playwright for end-to-end tests
4. Testing library for user interactions
5. Mock Service Worker for API mocking

### CI/CD Pipeline
1. GitHub Actions or GitLab CI
2. Automated testing on pull requests
3. Code quality checks (PHPStan, ESLint)
4. Security scanning
5. Automated deployment to staging
6. Manual approval for production

## Deployment Instructions

### Production Environment
1. Web Server: Nginx or Apache
2. PHP: 8.1+ with FPM
3. Database: MySQL 8.0+ or PostgreSQL 13+
4. Redis: For caching and queues
5. Supervisor: For queue workers
6. SSL: Let's Encrypt certificate

### Deployment Steps
1. Pull latest code
2. Composer install --no-dev --optimize-autoloader
3. npm ci && npm run build
4. php artisan migrate --force
5. php artisan config:cache
6. php artisan route:cache
7. php artisan view:cache
8. Restart queue workers
9. Restart PHP-FPM
10. Clear caches if needed

## Monitoring & Maintenance

### Health Checks
1. API endpoint responsiveness
2. Database connection status
3. Queue worker status
4. Cache hit ratios
5. Disk space utilization
6. Memory usage

### Logging
1. Laravel daily logs
2. Error tracking integration
3. Access logs (nginx/apache)
4. Custom business event logging
5. Performance metrics collection

### Backup Strategy
1. Daily database backups
2. Weekly full system backups
3. Off-site backup storage
4. Quarterly restore testing
5. Point-in-time recovery capabilities

## Conclusion
This documentation provides a comprehensive overview of the GEO Optimization Platform based on available code analysis and reasonable inferences. Where direct observation was not possible due to platform loading states, features have been supplemented with industry-standard expectations for similar platforms.

Developers should verify all assumptions against the actual implementation and update this documentation as the platform evolves.