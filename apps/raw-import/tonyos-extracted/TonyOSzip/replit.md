# TonyOS, SmartBrain & CodeBench

## Overview

This project comprises three main applications:

**SmartBrain Chat**: A multi-model AI chat router supporting OpenAI, Claude, and Gemini, with an optional citation mode for factual accuracy. It runs on port 5000.

**TonyOS**: A personal AI command center for Tony Beal, focused on revenue operations, StoryBrand messaging, sales targeting, and business strategy. It provides a private AI console for planning, writing, selling, and building systems for manufacturing and RevOps. Key modules include:
- **Journal**: A full-featured journaling app with mood tracking, gratitude lists, AI prompts, and an "Ask Agent" feature for insights.
- **AI Chat Console**: A multi-model chat interface with provider, model, mood, and persona selectors, including a "Truth Mode" for citations.
- **Daily Command Center**: A tool for tracking daily focus, wins, and next actions.
- **Tony CRM**: A HubSpot-style outreach dashboard with contact management, company intelligence scanning, Natoli classification, Apollo.io integration, activity tracking, pipeline management, and CRM Governor for decision intelligence. Enterprise features include: visual deals pipeline with 6 stages (Prospecting, Discovery, Proposal, Negotiation, Closed Won, Closed Lost), task management with priority levels and due date tracking, people search via Apollo API for finding key personas, plant/site hierarchy tracking, compliance event timeline, and intent signal monitoring.
- **CRM Governor**: A judgment layer that sits above CRM execution, featuring assumption tracking, outcome scoring (positive/neutral/negative), memory decay detection, and pipeline health analysis.
- **Message Clarity Framework**: A 7-part StoryBrand messaging framework builder with multi-project vault and HTML export.
- **Website Analyzer**: A research dashboard for due diligence.
- **Job Search HQ**: A tool to track job applications, actions, and interview notes.
- **Money and Budget**: A two-week budget snapshot.
- **Website Builder**: For creating landing page drafts with live preview.
- **Natoli RevOps**: A command center for revenue operations, outlining principles, systems, targeting, and personas.
- **Validation Document Generator**: A GMP-compliant validation documentation tool for creating URS, SDS, IQ, OQ, PQ protocols with full lifecycle traceability, document control metadata, company branding injection, auto-revision history, and PDF/Word export. Netlify-deployable as static HTML.

**CodeBench**: An AI-powered code sandbox for building HTML/CSS/JS projects with a live preview, AI assistance for debugging, improving, building, and explaining code. It uses Replit Auth for authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

**Frontend Architecture**:
- **Template Engine**: Flask's Jinja2.
- **Styling**: Custom CSS with a dark theme, glassmorphism effects, and responsive design.
- **JavaScript**: Vanilla JS for interactive elements and API calls.
- **UI Pattern**: Single-page application-like experience with a landing page and tool cards.
- **TonyOS SDK**: A shared JavaScript module (`/static/tonyos-sdk.js`) for common UI behaviors and API helpers.

**Backend Architecture**:
- **Framework**: Python Flask web application (TonyOS and SmartBrain components) running on port 5000. CodeBench uses Express.js.
- **AI Integration**: OpenAI API is central for chat completions and content generation across TonyOS. SmartBrain and CodeBench integrate OpenAI, Claude, and Gemini.
- **Memory System**: TonyOS uses file-based persistence with `long_memory.txt` and `memory_log.jsonl`.
- **Database**: PostgreSQL with SQLAlchemy ORM for user authentication and data storage across TonyOS, including journal entries, CRM data, and contact submissions. CodeBench uses PostgreSQL for session storage.
- **Authentication**: Replit Auth for secure user login and session management, utilizing `replit_auth.py` for TonyOS and `codebench/replitAuth.js` for CodeBench.
- **TonyOS Agent Server**: A Node.js Express server on port 6000 providing AI-powered journal insights (`/TonyOS/agent_server`).
- **Apollo.io Server**: A Node.js Express server on port 3001 for company enrichment and Natoli scoring (`/TonyOS/apollo-server`).

## Natoli RevOps Context

**Reference**: https://revops-tony.netlify.app/

**Core Philosophy**: Revenue Operations at Natoli aligns Sales, Marketing, and Scientific Support into one operating system that produces predictable pipeline, clean data, and faster decision making. The focus is signal, velocity, and accountability - not volume.

**Key Targeting Framework**:
- **Division Routing**: Companies are routed to Natoli Scientific (pharma formulation, R&D) or Natoli Engineering (tooling, manufacturing) or Both
- **Primary Markets (25+ validated industries)**: 
  - **Core**: Pharmaceutical, Generic Pharma, Nutraceutical/Dietary Supplements, Veterinary Pharma, Cannabis
  - **Energy & Materials**: Nuclear Fuel/SMR, Battery Manufacturing (solid-state, lithium, sodium-ion), Hydrogen Storage, Catalyst Manufacturing, Carbon Capture Sorbents
  - **Advanced Manufacturing**: Advanced Ceramics (aerospace/defense), 3D Printing Feedstock, Rare Earth Magnets, Semiconductor Materials, Space Materials
  - **Defense**: Explosives/Propellants, Ammunition/Ballistics
  - **Industrial/Specialty**: Abrasives, Medical Implants, Cosmetics Pressed Powders, Agricultural Micronutrient Pellets, Animal Feed Supplements, Forensic Standards, Recycling/Reclaimed Materials, Art Conservation/Pigments
- **Industry Detection**: Priority-based detection with NAICS prefix matching to prevent misclassification (e.g., battery vs cannabis)
- **Persona Tiers**: Director of R&D, Director of MS&T, VP of Manufacturing, Process Engineering Manager, Formulation Director, Tech Transfer leads
- **Environment Tiers**: Tier 1 = High-trust, high-complexity buying environments

**Rule**: If we cannot defend the target and the persona, we do not sequence.

**Key Architectural Decisions**:
- **Modular Design**: Separation of concerns into distinct applications (TonyOS, SmartBrain, CodeBench) and modules within TonyOS.
- **Multi-Model AI Support**: Integration of OpenAI, Claude, and Gemini APIs for diverse AI capabilities.
- **Data Persistence**: A combination of PostgreSQL for structured data and file-based storage for AI memory logs.
- **API-Driven**: Extensive use of RESTful API endpoints for internal communication and external integrations.
- **Security**: Robust security measures including disabled debug mode in production, secure session cookies, security headers, API key protection, rate limiting, and CORS control.
- **Vector Database**: `pgvector` for smart memory and similarity search in TonyOS.

## External Dependencies

**APIs and Services**:
- **OpenAI API**: For core AI functionalities, chat completions, and content generation.
- **Anthropic API**: For Claude models in SmartBrain and CodeBench.
- **Google Gemini API**: For Gemini models in SmartBrain and CodeBench.
- **Apollo.io API**: For company enrichment and persona scoring in Tony CRM.
- **NewsAPI**: For fetching recent company news from trusted sources (Reuters, Bloomberg, WSJ, FDA, pharma publications) in Tony CRM account views.
- **Google Sheets API**: For syncing various TonyOS data (Journal, CRM, Budget, Daily, Jobs) to Google Sheets.
- **Replit Auth**: For user authentication across TonyOS and CodeBench.

**Python Packages**:
- `flask`
- `openai`
- `python-dotenv`
- `sqlalchemy`
- `psycopg2-binary` (for PostgreSQL)
- `pgvector`

**Node.js Packages (for CodeBench, Agent Server, Apollo Server)**:
- `express`
- `openai` (or equivalent for Claude/Gemini)
- `openid-client`
- `connect-pg-simple`