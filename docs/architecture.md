# Playwright BDD Framework Architecture

## 1. Purpose and Scope

This document defines a beginner-friendly JavaScript automation framework for the [AutomationExercise](https://automationexercise.com/) ecommerce application.

The framework will use:

- Node.js and JavaScript
- JSDoc for type information and editor assistance
- Cucumber.js as the only test runner
- Playwright for browser automation and `APIRequestContext` for API automation
- Page Object Model for UI behavior
- A custom Cucumber World for scenario state
- Cucumber Before and After hooks for lifecycle management
- ESLint and Prettier for code quality and formatting
- Cucumber HTML and Allure for reporting
- GitHub Actions for CI execution

This is a single-environment QA framework. It intentionally excludes fixtures, service classes, schema classes, multiple environment files, and unnecessary base classes.

## 2. Design Principles

1. Cucumber.js owns test execution and scenario lifecycle.
2. Each scenario receives independent browser and data state.
3. Hooks create objects; step definitions use them.
4. Page Objects contain UI interaction behavior, not scenario intent.
5. The API client contains reusable HTTP request behavior, not business workflows.
6. Step definitions remain readable and delegate technical work.
7. Assertions are made close to the behavior being verified.
8. Prefer explicit, simple code over abstractions that hide control flow.
9. Test data is visible in the scenario or in a small, purpose-specific data utility.
10. Failures leave enough evidence to diagnose the problem quickly.

## 3. Proposed Folder Structure

```text
Playwright-BBD-Framework/
|-- .github/
|   `-- workflows/
|       `-- playwright-bdd.yml
|-- config/
|   `-- qa.js
|-- features/
|   |-- auth.feature
|   |-- products.feature
|   |-- cart.feature
|   |-- api.feature
|   `-- step-definitions/
|       |-- auth.steps.js
|       |-- products.steps.js
|       |-- cart.steps.js
|       `-- api.steps.js
|-- src/
|   |-- pages/
|   |   |-- login.page.js
|   |   |-- home.page.js
|   |   |-- products.page.js
|   |   `-- cart.page.js
|   |-- api/
|   |   `-- automation-exercise.api.js
|   |-- support/
|   |   |-- world.js
|   |   |-- hooks.js
|   |   `-- cucumber.js
|   `-- utils/
|       |-- test-data.js
|       |-- evidence.js
|       `-- assertions.js
|-- reports/
|   |-- cucumber/
|   `-- allure/
|-- screenshots/
|-- package.json
|-- eslint.config.js
|-- .prettierrc
|-- .gitignore
`-- README.md
```

### Folder guidance

- `features/`: Business-readable scenarios and their step definitions.
- `src/pages/`: Page Objects, one primary page or meaningful page area per file.
- `src/api/`: The small reusable API client for AutomationExercise endpoints.
- `src/support/`: Custom World, hooks, and Cucumber configuration.
- `src/utils/`: Small stateless helpers only. Utilities must not become hidden application layers.
- `config/qa.js`: The single QA base URL and other stable QA settings.
- `reports/` and `screenshots/`: Generated output and normally ignored by Git.
- `.github/workflows/`: CI commands and artifact publishing.

The exact number of Page Objects can grow with coverage, but each new file must represent a clear page or feature responsibility.

## 4. Component Responsibility Matrix

| Component | Responsibilities | Must not do |
|---|---|---|
| Feature files | Describe business behavior, examples, tags, and expected outcomes | Contain selectors or JavaScript implementation details |
| Step definitions | Translate Gherkin into calls to World objects, Page Objects, API client, and assertions | Own browser setup, duplicate selectors, or implement large workflows |
| Custom World | Hold scenario-scoped references such as context, page, Page Objects, API client, response data, and test data | Create shared global state or manage the full test lifecycle |
| Before hook | Create browser context, Page, required Page Objects, and API client when needed; initialize scenario state | Contain scenario-specific business actions |
| After hook | Capture configured failure evidence, close context, and perform required cleanup for every attempt | Hide assertion failures or continue using closed resources |
| Page Objects | Expose readable UI actions and page-level state checks; own locators | Contain Cucumber concepts or cross-scenario state |
| API client | Send reusable HTTP requests, normalize request options, and return response data | Become a business service layer or contain scenario assertions |
| Utilities | Provide small reusable stateless helpers such as data generation, evidence naming, and focused assertions | Store browser state or replace Page Objects/API client |
| Cucumber configuration | Define feature paths, support files, formatters, retries, and report output | Run a second test framework |
| CI workflow | Install dependencies, run Cucumber, publish reports/artifacts, and expose failures | Contain test logic |

## 5. Object Initialization and Data Flow

### Before hook flow

1. Cucumber starts a scenario and creates one Custom World instance.
2. The Before hook reads the single QA configuration.
3. The hook launches a Playwright browser as configured for local or CI execution.
4. The hook creates a new browser context for the scenario.
5. The hook creates a new Page from that context.
6. The hook creates the Page Objects using the scenario Page.
7. The hook creates the API client using the context's `APIRequestContext` or a dedicated request context, when the scenario requires API calls.
8. The hook stores all references on the World.
9. The step definition accesses those references through `this` and performs the scenario action.

When Cucumber retries a failed scenario, it creates a fresh Custom World before
the next attempt. The same `Before` and `After` lifecycle runs again, so
browser state, Page Objects, API request contexts, and scenario data are
attempt-scoped. Retried attempts remain visible in Cucumber's report; they do
not retry individual Playwright actions.

### Step-to-application flow

```text
Gherkin scenario
    -> step definition
        -> World reference
            -> Page Object or API client
                -> browser or HTTP request
                    -> assertion and scenario result
```

### Hybrid account flow

The tagged account integration scenario uses the same scenario World from
start to cleanup:

```text
POST /createAccount
    -> store email, password, and account name on World
        -> LoginPage signs in through the UI
            -> assert the logged-in account name
                -> GET /getUserDetailByEmail
                    -> assert the created account details
                        -> DELETE /deleteAccount
```

The step definitions own this scenario flow and its assertions. The Page
Objects remain UI-only, the API client remains an HTTP wrapper, and the
existing `After` hook deletes a created account if the scenario fails before
explicit API deletion. Tagging the scenario with `@integration` ensures the
`Before` hook creates the API client; `@ui` and `@api` keep the scenario
discoverable with the corresponding tag filters. The generated email makes
the temporary account unique; its email, password, and display name remain on
that scenario's World.

### After hook flow

1. The hook checks the scenario result.
2. For failed scenarios, it captures configured evidence such as a screenshot and relevant metadata.
3. It attaches evidence to the Cucumber report when supported by the selected formatter.
4. It closes the scenario browser context.
5. It disposes of any separately created request context.
6. It closes the browser process when the framework lifecycle requires it.

The exact shutdown order must ensure that evidence is captured before the context is closed.

## 6. Scenario Isolation

Each scenario gets:

- A new Custom World instance.
- A new browser context.
- A new Page.
- New Page Object instances pointing to that Page.
- Scenario-local API response data and test data.

Scenarios must not share cookies, local storage, pages, mutable World properties, or API-created records unless sharing is explicitly part of the scenario design. Parallel execution should be treated as a later capability; the first version should run reliably in a single worker.

When a scenario creates an account or other data, cleanup should be performed in its After hook or in the same scenario flow when the application supports it. Cleanup failures should be visible and must not silently replace the original test failure.

## 7. Page Object Model Standards

- Use one class per page or coherent page area only when a class improves readability.
- Receive the Playwright `Page` through the constructor.
- Keep locators and UI actions inside the Page Object.
- Expose business-readable methods such as login, search for a product, add a product to the cart, or verify a product is visible.
- Keep methods focused; avoid methods that perform an entire multi-page business journey.
- Return useful Page Object instances only when navigation genuinely changes the page.
- Keep assertions in Page Objects only for page-level state checks. Scenario-specific expectations remain in step definitions or focused assertion helpers.
- Do not use arbitrary timeouts or fixed sleeps. Wait on visible, enabled, attached, URL, or response conditions.

## 8. API Client Standards

The API client is a small reusable wrapper around AutomationExercise HTTP endpoints.

It should:

- Accept an `APIRequestContext` and the configured base URL.
- Expose direct endpoint methods with clear names.
- Centralize common request details such as URL construction, headers, and request options.
- Return the Playwright response or a small response representation that keeps status, body, and headers available.
- Leave scenario-specific assertions to step definitions or assertion helpers.
- Keep request methods independent and easy to trace to the documented endpoint.

It should not contain domain-wide orchestration, database access, generated schema validation, or a hidden service layer.

## 9. Locator and Assertion Standards

### Locators

Use this preference order:

1. User-facing role and accessible name.
2. Label, placeholder, or text when it represents stable user-visible content.
3. Stable application attributes such as `data-qa` when available.
4. CSS selectors tied to stable structure as a last resort.

Avoid XPath unless no practical stable alternative exists. Do not use generated CSS classes, positional selectors, or selectors based on styling. Keep each locator close to the Page Object behavior that uses it.

### Assertions

- Assert observable outcomes, not implementation details.
- Prefer Playwright web-first assertions for UI state.
- Include an assertion for each meaningful acceptance criterion.
- Use response status and response body assertions for API scenarios.
- Keep failure messages specific enough to identify the expected behavior.
- Do not use manual polling or sleeps to make assertions pass.

## 10. Coding Standards

- Use modern JavaScript supported by the selected Node.js LTS version.
- Use JSDoc on World properties, hook parameters, Page Object constructors, API client methods, and non-obvious data structures.
- Use ESLint as the automated correctness and consistency check.
- Use Prettier for formatting; do not hand-format around Prettier.
- Prefer `const`; use `let` only when reassignment is required.
- Use `async` and `await` consistently for Playwright and API operations.
- Keep functions small and named for intent.
- Avoid one-letter variables and unexplained magic values.
- Avoid shared mutable module state.
- Keep test data deterministic where possible and generate unique values only when the application requires them.
- Do not put implementation logic in feature files.
- Do not add a base Page Object class unless a real, repeated behavior cannot remain clearer without it.
- Do not introduce fixtures, services, schemas, or another test runner.

## 11. Naming Conventions

- Files: lowercase kebab case, with role suffixes such as `login.page.js`, `hooks.js`, and `auth.steps.js`.
- Classes: PascalCase, such as `LoginPage` and `AutomationExerciseApi`.
- Methods and variables: camelCase, using verbs for actions and nouns for values.
- Cucumber steps: business-readable phrases that avoid technical details.
- World properties: descriptive names such as `page`, `loginPage`, `apiClient`, and `lastResponse`.
- Feature files: lowercase business capability names.
- Tags: lowercase, purpose-based names such as `@ui`, `@api`, `@smoke`, and `@regression`.
- Environment constants: uppercase only for true constants such as `BASE_URL`.
- Reports and evidence: include feature, scenario, timestamp, and status when practical.

## 12. Reporting and Evidence

Cucumber HTML reporting is the primary human-readable scenario report. Allure is an additional report for trend-friendly results, attachments, and CI inspection.

At minimum, failed UI scenarios should provide a screenshot. The framework may later attach the current URL, page title, console errors, or API response details where those artifacts are useful and safe to publish. Reports and screenshots must be excluded from source control unless the repository explicitly requires sample artifacts.

## 13. GitHub Actions Expectations

The CI workflow should:

1. Run on pull requests and the selected branch events.
2. Use the supported Node.js LTS version.
3. Install locked dependencies with the repository's package manager.
4. Install the required Playwright browser dependencies.
5. Run ESLint and the Cucumber suite.
6. Generate Cucumber and Allure results.
7. Upload reports and failure evidence as workflow artifacts, including when tests fail.
8. Return a failing workflow status when linting or scenarios fail.

The initial workflow should use one worker and the single QA environment. Parallelization and sharding can be evaluated after the suite is stable.

## 14. Development Roadmap

### Phase 1: Project foundation

- Initialize the Node.js project.
- Add Playwright, Cucumber.js, ESLint, Prettier, and reporting dependencies.
- Add the single QA configuration.
- Establish npm scripts and ignore generated output.

### Phase 2: Cucumber lifecycle

- Define the Custom World shape with JSDoc.
- Implement the Before and After hooks.
- Verify that every scenario receives an isolated context and Page.
- Add failure screenshot capture.

### Phase 3: First UI slice

- Add the home, login, and products Page Objects.
- Implement one small authentication feature.
- Validate locator and assertion standards with a passing and failing scenario.

### Phase 4: API slice

- Add the reusable AutomationExercise API client.
- Add API feature coverage for a small set of stable endpoints.
- Store response data on the World only for the current scenario.

### Phase 5: Core ecommerce coverage

- Add cart and checkout-related Page Objects as needed.
- Add focused feature files for product search, cart behavior, and authentication.
- Add tags for smoke and regression selection.

### Phase 6: Reporting and CI

- Configure Cucumber HTML output.
- Configure Allure result generation and attachments.
- Add GitHub Actions, browser installation, and artifact upload.
- Run lint, formatting checks, and the Cucumber suite in CI.

### Phase 7: Stabilization

- Remove flaky waits and unstable locators.
- Review scenario isolation and cleanup.
- Document local setup and troubleshooting.
- Measure runtime and only then consider controlled parallel execution.

## 15. Limitations and Future Scalability

This simplified architecture intentionally has tradeoffs:

- A large Custom World can become difficult to understand if too many objects and values are stored on it.
- Hooks can become overloaded if they create every possible object for every scenario. Object creation should stay limited to the objects the framework consistently needs, or be selected by clear tags where that remains simple.
- Without a services layer, complex API workflows may make the API client too large.
- Without schemas, API contract validation is limited to explicit status and body assertions.
- One QA configuration does not support environment comparison or promotion workflows.
- A single browser lifecycle model may need revision for parallel execution.
- Shared setup and cleanup become more challenging as test data volume grows.
- Cucumber step reuse can become ambiguous if steps are written too generically.
- HTML and Allure reporting require maintenance as formatter integrations and CI requirements change.

Possible later additions, only when justified by real complexity, are a small data factory, API workflow helpers, schema validation, environment selection, parallel execution controls, and more structured artifact management. These should be introduced as responses to demonstrated maintenance problems rather than as part of the initial framework.

## 16. Approval Checkpoint

This document defines the architecture only. No implementation code should be added until the architecture, folder structure, lifecycle approach, and standards are approved.
