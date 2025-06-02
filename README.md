# Rate It Plus - Movie and Series Collection App

This repository contains the frontend (`meus_filmes_app`) and backend (`rateitplus_backend`) for the Rate It Plus application.

## Important Recommendations & Notes

### 1. Git Repository Management
*   **`node_modules` directory**: This directory should not be version-controlled. It contains project dependencies that can be very large and are specific to your local environment. Ensure `node_modules/` is listed in your `.gitignore` file. If it was accidentally committed, remove it from Git tracking using `git rm -r --cached node_modules` followed by a commit.
*   **Local Database Files (e.g., `rateitplus_local.db`)**: Local database files should generally not be committed to the repository, especially if they contain user-specific or test data. Add patterns like `*.db`, `*.sqlite`, `*.sqlite3` to your `.gitignore` file.
*   **API Keys & Sensitive Information**: Never commit API keys, secrets, or sensitive configuration directly into your codebase (e.g., in frontend JavaScript or backend source files). Use environment variables (e.g., via a `.env` file that is gitignored) and access them in your backend code using `process.env.YOUR_API_KEY`.

### 2. Backend Development
*   **Testing**: Implement a proper testing strategy for the backend API. This includes unit tests for individual functions/modules and integration tests for API endpoints. The `package.json` suggests using `jest` (`npm test` or `npx jest`). Consider setting up a test environment and writing tests for authentication, CRUD operations, and business logic (like score calculation).
*   **API Key Security**: The TMDB API key and any other sensitive keys should be stored in an `.env` file in the `rateitplus_backend` directory and accessed via `process.env`. Ensure `.env` is in your `.gitignore`.

### 3. Frontend Development
*   **API Calls**: Calls to external services that require secret API keys (like TMDB) should be proxied through your backend. This prevents exposing keys directly in the frontend JavaScript. This project has been updated to reflect this pattern for TMDB calls.
*   **Build Process**: For production, consider implementing a frontend build process (e.g., using tools like Vite, Parcel, or Webpack). This can help with:
    *   Minifying HTML, CSS, and JavaScript for faster loading.
    *   Bundling JavaScript modules.
    *   Managing environment variables securely for the frontend (if needed, though backend proxy is preferred for API keys).
*   **JavaScript File `meus_filmes_app/js/dataManager.js`**: This file was partially refactored. The `PESOS_PADRAO` constant was removed. However, due to tool limitations during the automated refactoring, the `calcularScoreFinal` function (which references the removed `PESOS_PADRAO`) could not be automatically removed or commented out, and attempts to restore `PESOS_PADRAO` also failed. This will likely cause a runtime error if `calcularScoreFinal` is called. **Manual correction is required for this file.** Either delete `calcularScoreFinal` or restore `PESOS_PADRAO`.

### 4. Environment Setup
*   **Backend**:
    1.  Navigate to `rateitplus_backend`.
    2.  Create a `.env` file by copying `.env.example` (if one exists) or creating it manually.
    3.  Add your `TMDB_API_KEY` and a strong `JWT_SECRET` to the `.env` file.
    4.  Run `npm install` to install dependencies.
    5.  Run `node server.js` (or your configured start script) to start the backend server.
*   **Frontend**:
    1.  Open `meus_filmes_app/index.html` in your browser (usually served via a local web server or directly for simple static sites).
