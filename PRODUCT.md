# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are:
1. **Survey Designers / Form Creators**: Field research coordinators, census supervisors, and data architects who design complex survey instruments, relational data schemas, validation logic, and workflows.
2. **Organization Administrators**: Team leads and institutional managers overseeing data collection teams, survey assignments, access permissions, and API integrations.
3. **Data Enumerators / Field Surveyors**: Mobile and web field workers collecting data in both online and offline-first environments.

## Product Purpose

Cerdas is an open, offline-first survey, data collection, and application-building platform. It empowers institutions to build and deploy complex, skip-logic enabled survey instruments and relational forms from scratch or replicated 2-way with Google Sheets, without vendor lock-in and with robust auditability and team access control.

## Positioning

Unlike generic SaaS form builders (such as Typeform or Google Forms) that require continuous internet connectivity and lack relational data schemas, and unlike legacy enterprise survey tools (such as CSPro or ODK) that suffer from steep learning curves and fragmented authoring, Cerdas combines an intuitive visual and code-level schema editor with an enterprise-grade offline-first mobile engine, Google Sheets live sync, and deterministic API Key integration.

## Operating Context

- Users work in desktop web browsers to design forms, configure validation logic, and manage organizational units.
- Field workers operate on low-end Android mobile devices with intermittent or nonexistent cellular connectivity in rural and remote locations.
- Data synchronization must be deterministic, auditable, and resilient to conflict resolution.

## Constraints & Architectural Principles

- **Single Responsibility Principle (SRP)**: Components and modules must have a single reason to change. Monolithic pages must be decomposed into dedicated presentation, container, and dialog sub-components.
- **Hexagonal Architecture & Dependency Inversion**: Domain logic and application services depend on abstractions (interfaces/ports), not concrete implementations (adapters).
- **Interface-First Design**: Contracts, prop interfaces, and API signatures are defined first before concrete component logic.
- **Line Limit**: No source file may exceed 600 lines of code.
- **Framework7 Vue Desktop Adaptation**: Avoid mobile navbar artifacts on desktop screens; maintain consistent header heights, rounded button corners, and accessible contrast.
