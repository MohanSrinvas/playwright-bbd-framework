# Playwright BDD Framework

This JavaScript Playwright + Cucumber.js framework targets
[AutomationExercise](https://automationexercise.com/) and uses scenario-scoped
Page Objects stored on a custom Cucumber World.

## Prerequisites

- Node.js 20 or newer (the current LTS line is recommended)
- npm 10 or newer

Check the installed versions:

```bash
node --version
npm --version
```

## Setup

Install the Node dependencies and the Playwright browsers you plan to test:

```bash
npm install
npx playwright install chromium firefox webkit
```

Install browsers individually when needed:

```bash
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

`npm run playwright:install` installs Chromium; `npm run
playwright:install:all` installs all three engines.

Copy `.env.example` to `.env`. Credential-based API scenarios require a valid
AutomationExercise account email and password in `API_USERNAME` and
`API_PASSWORD`. Keep those real values in the ignored local `.env`; never
commit credentials.

## Configuration

The single configuration module is [config/config.js](config/config.js). It
contains the QA UI URL, API URL, browser settings, Playwright timeouts, Cucumber
retries, logging level, and failure evidence policies. It validates these values as soon as
the Cucumber configuration or a support file imports it, so an invalid value
fails before scenarios execute.

Optional environment variables override the defaults:

| Variable               | Default                              | Purpose                                                |
| ---------------------- | ------------------------------------ | ------------------------------------------------------ |
| `UI_BASE_URL`          | `https://automationexercise.com`     | UI application URL                                     |
| `API_BASE_URL`         | `https://automationexercise.com/api` | API application URL                                    |
| `BROWSER`              | `chromium`                           | Playwright browser engine                              |
| `HEADLESS`             | `true`                               | Headless or headed browser execution                   |
| `SLOW_MO`              | `0`                                  | Delay between browser actions in milliseconds          |
| `ACTION_TIMEOUT`       | `10000`                              | Default Playwright action timeout                      |
| `NAVIGATION_TIMEOUT`   | `30000`                              | Default navigation timeout                             |
| `EXPECT_TIMEOUT`       | `10000`                              | Default assertion timeout                              |
| `CUCUMBER_RETRIES`     | `0`                                  | Number of Cucumber scenario retry attempts             |
| `CUCUMBER_WORKERS`     | `1`                                  | Number of Cucumber parallel workers                    |
| `SCREENSHOT_MODE`      | `only-on-failure`                    | Screenshot policy: `on`, `off`, or `only-on-failure`   |
| `TRACE_MODE`           | `retain-on-failure`                  | Trace policy: `on`, `off`, or `retain-on-failure`      |
| `VIDEO_MODE`           | `off`                                | Video policy: `off`, `on`, or `retain-on-failure`      |
| `CUCUMBER_HTML_REPORT` | `reports/cucumber/report.html`       | Cucumber HTML report path                              |
| `LOG_LEVEL`            | `INFO`                               | Minimum log level: `DEBUG`, `INFO`, `WARN`, or `ERROR` |
| `LOG_TO_FILE`          | `false`                              | Also write logs under `artifacts/logs/`                |

`CUCUMBER_WORKERS` controls Cucumber.js parallel execution and must be a
positive integer. The normal run defaults to one worker; `npm run
test:parallel` sets three workers and `npm run test:parallel:demo` runs the
three read-only `@parallel` examples with two workers. To choose another count,
run Cucumber directly with `npx cross-env CUCUMBER_WORKERS=5 cucumber-js
--config cucumber.config.js` (replace `5` as needed).

Select the browser with `BROWSER=chromium`, `BROWSER=firefox`, or
`BROWSER=webkit`. The browser-specific npm commands set this variable for you.
The `Before` hook records the selected engine as a scenario attachment, so it
appears with the scenario in Cucumber and Allure results. The default Cucumber
configuration writes both HTML and Allure results for every run.

Validate the effective configuration with:

```bash
npm run config:validate
```

### Logging

The small [utils/logger.js](utils/logger.js) Winston logger writes timestamped,
level-labelled messages to the console. Set the minimum level with `LOG_LEVEL`;
messages below it are filtered:

```bash
npx cross-env LOG_LEVEL=DEBUG npm run test:cucumber
npx cross-env LOG_LEVEL=WARN npm run test:cucumber
```

Enable a local log file with `LOG_TO_FILE=true`. Files are written to
`artifacts/logs/` and use the Cucumber worker ID and process ID in their names
so parallel workers do not overwrite one another. File logging is off by
default; logs continue to appear in the console. Cucumber worker logs include
scenario context, selected browser, meaningful Page Object actions, API
method/endpoint/status/duration, and failure/retry status. Failed scenarios
also receive a sanitized log excerpt as a Cucumber attachment.

GitHub Actions enables file logging at `INFO` level and uploads
`artifacts/logs/` as a separate artifact when the test job fails. Download the
`cucumber-<browser>-logs` artifact from the workflow run to inspect the worker
log files. Do not add credentials, request/response bodies, cookies, tokens,
or other personal data to log messages; Winston also redacts common secret and
personal-data metadata keys and email addresses.

Good logging describes an event without sensitive values:

```js
logger.info('Submitting login form');
logger.info('API request completed', { method: 'GET', endpoint: '/productsList', status: 200 });
```

Avoid logging credentials, headers, or bodies:

```js
logger.info(`Login with ${email} and ${password}`);
logger.debug('API response', { headers, body: responseBody });
```

### Test data and reusable utilities

Static UI and API examples live in
[`features/data/ui-test-data.json`](features/data/ui-test-data.json) and
[`features/data/api-test-data.json`](features/data/api-test-data.json), separate
from step definitions. The `createScenarioTestData` function in
[`features/data/test-data.js`](features/data/test-data.js) makes fresh deep
copies, and the Custom World creates one copy per scenario as `this.testData`.
Step definitions read values from `this.testData.ui` or `this.testData.api`;
only scenario-local copies should be changed. Do not mutate imported JSON
objects or keep generated data in module-level variables.

Use [`utils/common-utils.js`](utils/common-utils.js)'s `createUniqueEmail` when
a scenario creates a disposable account. It uses a UUID so concurrent
scenarios and retries do not reuse an address. The UI and API account scenarios
store the generated email on the World. Keep account passwords for local
configured-account access in the ignored `.env` (`API_USERNAME` and
`API_PASSWORD`); the JSON account passwords are synthetic values used only for
disposable test accounts, not real credentials.

The existing [`utils/logger.js`](utils/logger.js) is the shared logging
utility. Use its scenario logger for meaningful events; do not add another
logger or log credentials, request bodies, or personal data. Keep one-off
operations local to their caller—add common utilities only when multiple
callers need the same behavior.

Run the focused utility tests with:

```bash
npm run test:utilities
```

### Scenario retries

Cucumber.js 13.2.1 supports retries with its built-in `retry` configuration
option. This framework sets that option from `CUCUMBER_RETRIES`; it retries a
failed **scenario**, not individual Playwright actions or assertions.

```bash
npm run test:cucumber
npm run test:cucumber:retry
```

The normal command explicitly uses zero retries. The retry command uses two.
Two retries means a scenario can run up to **three times total**: one initial
attempt plus two retry attempts. Cucumber stops retrying as soon as an attempt
passes. To choose another non-negative count, run
`npx cross-env CUCUMBER_RETRIES=1 cucumber-js --config cucumber.config.js`.

Each attempt gets a new Custom World. Cucumber.js resets its World before
retrying, and the existing `Before` hook launches a new browser and creates a
new context, page, Page Objects, and (for `@api` and `@integration`) API client.
The context owns `context.request`, so closing that context also disposes its
scenario API request context. The `After` hook captures failure screenshots
and uniquely named traces for each failed attempt, performs scenario-data
cleanup, records video only when enabled, and closes resources. It attempts all
cleanup steps and reports
cleanup errors rather than silently discarding them.

The Cucumber HTML formatter identifies retried attempts and the final result
within the single report for a run. Allure receives Cucumber's attempt events;
the `After` hook labels failed attempts that Cucumber will retry, so use the
same retry-enabled run when generating Allure results and review those
attachments alongside the final scenario status. Formatters emit the attempts
within the one run/report (rather than rerunning the whole suite); trace
filenames are unique to avoid collisions. CI explicitly uses the retry command
and writes one browser-specific HTML report per matrix job.

Run the opt-in demonstration:

```bash
npm run test:retry:demo
```

Its simulated temporary condition deliberately fails on its first execution
and passes on the retry. The example is outside the default `features`
directory, so the normal suite does not contain an intentionally failing test.
The counter in this isolated demonstration only simulates an external
transient condition; do not use shared module state as normal scenario data.

Retries are useful for diagnosing occasional infrastructure or network
instability while preserving the first-attempt failure evidence. They are not
a way to make known product defects pass. Investigate tests that only pass
after retry, fix unstable selectors/waits or shared test data, and inspect
their screenshots, traces, and attempt statuses. Do not use retries instead
of reliable synchronization or scenario isolation.

The Custom World stores the validated configuration on `this.config` and holds
scenario-scoped references to the browser, context, page, Page Objects, and
optional API client. The Cucumber hooks create those objects in `Before`, start
configured tracing, and capture failure screenshots before closing the context
and browser in `After`. References are cleared during cleanup so a scenario
cannot leak state into the next one.

Step definitions access these objects through the World context (`this`):

```js
Given('the user opens the home page', async function () {
  await this.homePage.open();
});
```

The six core UI Page Objects are lightweight wrappers around the same scenario
Page, so creating them in `Before` keeps step definitions simple without
opening extra pages. The API client is created only for scenarios tagged
`@api` or `@integration`; UI-only scenarios do not pay for that object.

`cucumber.config.js` is passed explicitly by the npm scripts because Cucumber.js
does not automatically discover every `cucumber.config.js` filename in all
installed CLI versions. Cucumber.js remains the only test runner.

## Test commands

The commands below run the Cucumber feature suite. Tag expressions select
scenarios without changing feature code.

| Command                      | Purpose                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `npm test`                   | Run all Cucumber scenarios                               |
| `npm run test:cucumber`      | Run all Cucumber scenarios explicitly                    |
| `npm run test:utilities`     | Run the focused utility behavior tests                   |
| `npm run test:chromium`      | Run all scenarios in Chromium                            |
| `npm run test:firefox`       | Run all scenarios in Firefox                             |
| `npm run test:webkit`        | Run all scenarios in WebKit                              |
| `npm run test:parallel`      | Run all scenarios using three Cucumber worker processes  |
| `npm run test:parallel:demo` | Run the read-only `@parallel` examples using two workers |
| `npm run test:ui`            | Run scenarios tagged `@ui`                               |
| `npm run test:api`           | Run scenarios tagged `@api`                              |
| `npm run test:integration`   | Run scenarios tagged `@integration`                      |
| `npm run test:headed`        | Run with `HEADLESS=false` for visible-browser execution  |
| `npm run test:debug`         | Enable Playwright API debug logging with `DEBUG=pw:api`  |

Cucumber.js is the test runner here: its `parallel` option schedules
scenarios across worker processes. Playwright Test's workers belong to
Playwright Test's own runner and are not used by this framework. Do not add
Playwright Test as a second runner just to gain parallelism.

Each scenario gets its own Custom World and, in `Before`, launches its own
browser and creates its own context, page, Page Objects, and (when tagged for
API work) API client. API response references and generated account data live
on that World's instance, not in shared module state. `After` captures
scenario-attached screenshots and traces before closing the context and
browser; trace filenames use UUIDs to avoid collisions. There are no
`BeforeAll`/`AfterAll` hooks holding browser resources shared between workers.
Keep imported JSON as a static source, use the per-World copies for scenario
data, and generate unique identifiers for server-side records a scenario
creates.

The `@parallel` examples in `features/home.feature` and `features/products.feature`
are independent, read-only scenarios. Run them with
`npm run test:parallel:demo`; they can execute concurrently without depending
on order or shared data. The full `npm run test:parallel` run also schedules
other scenarios concurrently, so use it only when the shared QA service can
handle that load. Reduce the worker count (for example, to two) if the QA
environment rate-limits requests, becomes unstable, or account creation
conflicts occur. A failed scenario should be debugged on its own first with
`npm run test:cucumber -- --name "scenario name"` or with one worker; inspect
its attached screenshot and uniquely named trace before increasing concurrency.

### Common parallel pitfalls

- **Shared test data:** never cache API responses, generated accounts, or
  mutable scenario data in module-level variables. Keep scenario state on the
  World, use unique identifiers for created records, and clean them up in
  `After`.
- **QA overload or rate limits:** more workers are not always faster. Reduce
  `CUCUMBER_WORKERS` when the single QA environment slows down or rejects
  concurrent calls.
- **Conflicting artifact paths:** attach screenshots to the current scenario
  and use unique paths for files. Do not make every worker write a fixed
  `trace.zip` or a separate report to the same path; Cucumber's formatter
  collects worker results for one report.
- **Timing by sleeps or execution order:** do not add fixed waits or depend on
  another scenario running first. Use Playwright's auto-waiting assertions and
  make each scenario independently arrange its data.
- **Debugging only in parallel:** first reproduce the named scenario alone
  (`npm run test:cucumber -- --name "scenario name"`). Then try two workers
  and inspect the scenario's attached screenshot/trace to tell a real race from
  QA service contention.

## API Testing

API scenarios use the existing `src/api/api.client.js` wrapper around
Playwright's `APIRequestContext`. The `Before` hook creates it for scenarios
tagged `@api` or `@integration`, stores it on Custom World as
`this.apiClient`, and API steps save their response on `this.apiResponse`.
The example in [features/api.feature](features/api.feature) calls the
documented AutomationExercise `GET /productsList` endpoint and checks both the
HTTP status and response body. The official endpoint list is available at
[AutomationExercise API Testing](https://www.automationexercise.com/api_list).

The client supports `get`, `post`, `put`, `patch`, and `delete`. Pass
Playwright request options to supply headers, a body (`data` or `form`), query
parameters, and other supported options. The client returns the original
Playwright response, with `assertStatus`, `assertResponseCode`, and `getJson`
helpers for common checks. Assertions on scenario-specific response data use
Playwright's `expect` in the step definitions. The supported API paths are in
`src/api/api-endpoints.json`; API scenario data is in
`features/data/api-test-data.json`. Use only methods and paths listed by the
application; client support for an HTTP verb does not mean every endpoint
accepts that verb.

Set `API_BASE_URL` in the environment (or local `.env`) to change the API root;
it defaults to `https://automationexercise.com/api`. Product scenarios do not
need credentials. Login and configured-account lookup scenarios use the valid
`API_USERNAME` (an account email address) and `API_PASSWORD` values. The
account lifecycle scenario creates a unique temporary account using generated
test credentials and removes it after the scenario, including during failure
cleanup. Client errors intentionally avoid printing request URLs, headers, or
bodies.

Run the API scenario with:

```bash
npm run test:api
```

## Hybrid UI/API Integration

The account integration scenario in
[`features/account.integration.feature`](features/account.integration.feature)
uses the documented account endpoints and existing scenario-scoped objects:

1. The API step creates a unique account and stores its email, password, and
   display name on the Cucumber World.
2. The login Page Object signs in through the browser using the World
   credentials; a Playwright web-first assertion checks the logged-in identity.
3. The API client retrieves the same account by email and the step asserts its
   API details.
4. The API client deletes the account. The existing `After` hook also attempts
   API cleanup if a failure happens before the scenario's delete step completes.

Run only this flow with `npm run test:integration`. It uses a generated unique
email and the non-secret API test password, so it does not depend on
`API_USERNAME` or `API_PASSWORD`. The scenario is tagged `@integration`, `@ui`,
and `@api`; the existing Cucumber HTML and Allure report commands work without
additional reporting configuration.

## Reports, evidence, and debugging

Every Cucumber run produces an HTML report at
`reports/cucumber/report.html` and Allure result files under `allure-results`.
The Allure results directory is reset at the start of each Cucumber run so a new
report does not mix in stale scenarios from an earlier run.
HTML output can be redirected with `CUCUMBER_HTML_REPORT`; the GitHub Actions
cross-browser workflow does this to produce one file per browser. Allure HTML
generation is a separate step because it renders the already collected results.

```bash
npm run test:cucumber
npm run report:allure
npm run report:cucumber
npm run report:allure:results
npm run lint
npm run format:check
npm run format
```

Open `reports/cucumber/report.html` in a browser for the Cucumber run summary,
step status, and attachments. `npm run report:allure` renders the most recent
`allure-results` into `reports/allure-report`; open that report's
`index.html`. The compatibility commands `report:cucumber` and
`report:allure:results` each start a fresh full Cucumber run and produce both
report formats. Usually run tests once, then generate the Allure HTML report.

Failure screenshots are attached to both reports and also saved under
`reports/screenshots/`. Traces are saved to `reports/traces/` when
`TRACE_MODE=on`, or only for failed attempts when using the default
`retain-on-failure`; `TRACE_MODE=off` disables tracing. Open a saved trace with:

```bash
npx playwright show-trace reports/traces/trace-<uuid>.zip
```

Video is off by default to keep runs and artifacts small. Set
`VIDEO_MODE=retain-on-failure` to record and keep only failed scenarios, or
`VIDEO_MODE=on` to keep each scenario recording under `reports/videos/`.
`VIDEO_MODE=off` records nothing. Video is attached to the reports when kept.
Screenshot and trace policies can similarly be set to `on` or `off` (see the
configuration table above).

### Beginner failure investigation

1. Find the failed scenario and its first failed step in the Cucumber or Allure
   report. Read the sanitized scenario log attachment for the browser, action,
   endpoint/status (for API activity), and retry status.
2. Inspect the failure screenshot in the report or
   `reports/screenshots/`. It shows the visible page at failure time.
3. If a trace was retained, open the ZIP with `npx playwright show-trace` and
   inspect the action timeline, DOM snapshots, and console/network events around
   the failed step.
4. Re-run only that scenario with one worker, first normally and then headed if
   the issue is difficult to see:

   ```bash
   npm run test:cucumber -- --name "scenario name"
   npx cross-env HEADLESS=false npm run test:cucumber -- --name "scenario name"
   ```

5. If it fails only under load, compare the isolated run with
   `npm run test:parallel`; check for shared data or QA service rate limits
   before increasing retries.

Evidence can contain application data visible in the browser or trace. Use
synthetic test accounts, keep real credentials in ignored `.env`/CI secrets,
and do not upload evidence to public locations. Logs redact common credential
and personal-data keys; screenshots, traces, and videos cannot reliably redact
page content, so enable video only when needed and restrict artifact access.
The GitHub Actions workflow uploads browser-specific Cucumber and Allure
reports and evidence as workflow artifacts, and uploads logs on test failure.

## Cross-browser testing

The browser is selected by `BROWSER` and validated against `chromium`,
`firefox`, and `webkit`. The existing hooks launch the selected Playwright
browser for a scenario, create that scenario's context, page, Page Objects, and
optional API client, then close the context and browser in `After`. This keeps
browser state isolated when Cucumber parallel workers are enabled. Page
Objects and feature files are shared as code; they do not depend on a specific
browser engine.

Run the same product scenarios on each engine:

```bash
npm run test:chromium -- --tags "@products"
npm run test:firefox -- --tags "@products"
npm run test:webkit -- --tags "@products"
```

Omit `-- --tags @products` to run the complete suite. The `BROWSER` value is
included as an attachment on each scenario, so the browser appears in Cucumber
and Allure reports. The manually dispatched GitHub Actions workflow
`.github/workflows/cross-browser.yml` offers `all`, `chromium`, `firefox`, and
`webkit`. Choosing `all` runs three independent matrix jobs and uploads an
HTML report per browser. Matrix jobs run one at a time to avoid overloading
the shared QA environment.

Browsers can differ in rendering, focus and keyboard behavior, native form
validation, and timing. Prefer accessible locators, web-first assertions, and
Playwright auto-waiting rather than browser-specific selectors or sleeps. If a
scenario fails only in one engine, reproduce it with that engine's npm script,
check that its Playwright browser binary is installed, then inspect that
scenario's report attachment, screenshot, and trace. Linux CI must install
browser system dependencies; the workflow uses `playwright install --with-deps`
for its selected engine. If a headed local run is slow or times out, try a
headless run, for example:

```bash
npx cross-env BROWSER=firefox HEADLESS=true npm run test:cucumber -- --tags "@smoke"
```

## Project conventions

- ES Modules are used throughout the project.
- Cucumber.js is the only test runner.
- JSDoc documents framework contracts and improves editor assistance.
- Page Objects own UI locators and actions; step definitions express intent.
- Hooks own scenario lifecycle and isolation.
- Generated reports, screenshots, local environment files, and dependencies are
  ignored by Git.
- Do not add fixtures, services, schemas, or hardcoded credentials.

The full design is documented in [docs/architecture.md](docs/architecture.md).

## Page Object Standards

- Keep one focused class per page or meaningful page area in `src/pages/`.
- Accept the scenario's Playwright `Page` in the constructor; do not launch
  browsers or create pages inside a Page Object.
- Initialize fixed locators once in the constructor. Build data-specific
  locators from those cached roots when a method receives a product or row name.
- Prefer accessible roles, labels, and placeholders. Use stable IDs or CSS only
  when the application does not expose a useful accessible locator.
- Keep selectors and UI interactions in Page Objects. Methods should describe
  actions such as `searchFor`, `openProductDetails`, or `completeRegistration`.
- Use Playwright actions and their built-in auto-waiting; do not add fixed sleeps.
- Keep scenario intent and acceptance assertions in feature steps. Page Objects
  may expose page-level text or state needed by those assertions.
- Keep UI interactions separate from `src/api/`; do not add fixtures, services,
  shared base classes, or credentials to Page Objects.

Hooks construct all six objects in `Before`, and steps access them through the
World's `this` context:

```js
When('the user opens the product catalog', async function () {
  await this.homePage.openProducts();
});
```

## UI Scenarios

Static login, account, and product values are stored in
[features/data/ui-test-data.json](features/data/ui-test-data.json). A unique
email address is generated for the account lifecycle scenario so it can create,
log in with, and delete its own temporary account.

The UI features cover:

- Login: invalid credentials, required credentials, and successful login after
  creating a temporary account.
- Home: home-page display, product-catalog navigation, and empty-cart navigation.
- Products: matching search, no-result search, and product details.
- Cart: adding a product, verifying cart contents, removing the product, and
  verifying the empty state.

Each scenario name begins with `Verify`, `Validate`, or `Verify`-style behavior
language; features use `@ui` plus capability tags such as `@login`, `@products`,
`@cart`, and `@smoke`. The product and cart scenarios open the verified catalog
route directly; the home feature separately exercises visible navigation.

## Execution Flow

1. Cucumber selects a tagged scenario from a feature file.
2. The `Before` hook creates the scenario browser, context, Page, and all Page
   Objects, then stores them on the Custom World.
3. Step definitions read per-scenario copies of static JSON from
   `this.testData` and access UI behavior through `this.homePage`, `this.loginPage`, `this.productsPage`,
   `this.productDetailsPage`, and `this.cartPage`.
4. Page Objects perform Playwright interactions; steps assert observable UI
   outcomes with Playwright web-first assertions.
5. The `After` hook attaches a failure screenshot when configured, saves the
   failure trace, and closes scenario resources.

No fixtures, service layer, or additional test runner are used. The hook blocks
only the observed third-party Google ad-serving URLs to prevent injected ad
iframes from intercepting user interactions; application requests remain
untouched.
