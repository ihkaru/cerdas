# Contributing to Cerdas

Thank you for your interest in contributing to Cerdas! We welcome contributions from everyone.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/cerdas.git
    cd cerdas
    ```
3.  **Install dependencies**:
    ```bash
    pnpm install
    ```
4.  **Create a branch** for your feature or fix:
    ```bash
    git checkout -b feature/amazing-feature
    ```

## Development Workflow

-   **Backend**: Laravel (apps/backend)
-   **Client**: Vue 3 + Ionic (apps/client)
-   **Editor**: Vue 3 (apps/editor)

Run the development environment:
```bash
./start-all.bat
```

## Pull Request Process

1.  Ensure all tests pass.
2.  Update documentation if necessary.
3.  Open a Pull Request against the `main` branch.
4.  Describe your changes in detail.

## Code Style

-   We use **ESLint** and **Prettier** for JavaScript/TypeScript.
-   We use **Laravel Pint** for PHP.
-   Please run linting commands before committing.

## Reporting Issues

If you find a bug or have a feature request, please open an issue and include:
-   Steps to reproduce
-   Expected vs. actual behavior
-   Screenshots (if applicable)

Thank you for helping make Cerdas better!
