import { expect } from 'playwright/test';
import { performance } from 'node:perf_hooks';

/**
 * A small, scenario-scoped wrapper around Playwright's APIRequestContext.
 *
 * The client does not know about Cucumber scenarios or business workflows. It
 * builds endpoint URLs, sends HTTP requests, parses JSON, and provides simple
 * Playwright assertion helpers for common response checks. Feature step
 * definitions still own assertions about the specific response data required
 * by each scenario.
 */
export default class ApiClient {
  /**
   * Save the scenario's Playwright request context and the API root used by
   * every method. The request context is supplied by the Before hook, so the
   * client never creates hidden request or browser state of its own.
   *
   * @param {import('playwright').APIRequestContext} requestContext Playwright HTTP request context.
   * @param {string} baseUrl API root URL, for example https://automationexercise.com/api.
   * @param {import('winston').Logger} logger Scenario-scoped logger.
   */
  constructor(requestContext, baseUrl, logger) {
    this.requestContext = requestContext;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.logger = logger;
  }

  /**
   * Send a GET request to an endpoint below the configured API root.
   *
   * @param {string} path Endpoint path, such as `/productsList`.
   * @param {Parameters<import('playwright').APIRequestContext['get']>[1]} [options]
   *   Playwright request options, including query parameters.
   * @returns {Promise<import('playwright').APIResponse>} The unmodified Playwright response.
   */
  async get(path, options = {}) {
    return this.send('GET', path, options);
  }

  /**
   * Send a POST request. Use Playwright's `form` option for the
   * application-supported URL-encoded form fields.
   *
   * @param {string} path Endpoint path, such as `/searchProduct`.
   * @param {Parameters<import('playwright').APIRequestContext['post']>[1]} [options]
   *   Playwright request options and optional request body.
   * @returns {Promise<import('playwright').APIResponse>} The unmodified Playwright response.
   */
  async post(path, options = {}) {
    return this.send('POST', path, options);
  }

  /**
   * Send a PUT request. Use Playwright's `form` option for the
   * application-supported URL-encoded form fields.
   *
   * @param {string} path Endpoint path, such as `/updateAccount`.
   * @param {Parameters<import('playwright').APIRequestContext['put']>[1]} [options]
   *   Playwright request options and optional request body.
   * @returns {Promise<import('playwright').APIResponse>} The unmodified Playwright response.
   */
  async put(path, options = {}) {
    return this.send('PUT', path, options);
  }

  /**
   * Send a PATCH request. This is generic HTTP-client support only; use it
   * with an application endpoint only when that endpoint documents PATCH.
   *
   * @param {string} path Endpoint path relative to the configured API root.
   * @param {Parameters<import('playwright').APIRequestContext['patch']>[1]} [options]
   *   Playwright request options and optional request body.
   * @returns {Promise<import('playwright').APIResponse>} The unmodified Playwright response.
   */
  async patch(path, options = {}) {
    return this.send('PATCH', path, options);
  }

  /**
   * Send a DELETE request. Some documented APIs accept form fields on DELETE,
   * which can be supplied with Playwright's `form` option.
   *
   * @param {string} path Endpoint path, such as `/deleteAccount`.
   * @param {Parameters<import('playwright').APIRequestContext['delete']>[1]} [options]
   *   Playwright request options and optional request body.
   * @returns {Promise<import('playwright').APIResponse>} The unmodified Playwright response.
   */
  async delete(path, options = {}) {
    return this.send('DELETE', path, options);
  }

  /**
   * Send one HTTP request and return Playwright's response unchanged. Keeping
   * the original response lets a step inspect headers, the HTTP status, and
   * the response body without the client hiding application-specific details.
   *
   * Pass request bodies through Playwright's standard options:
   * - `data` for JSON, text, or binary data.
   * - `form` for URL-encoded form fields.
   * - `multipart` for multipart form fields, including file uploads.
   *
   * Supply only the body format supported by the selected endpoint. Request
   * options and response data are never logged; the safe error message avoids
   * echoing URLs, query parameters, or body fields that could contain secrets.
   *
   * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method HTTP method to send.
   * @param {string} path Endpoint path relative to the configured API root.
   * @param {Parameters<import('playwright').APIRequestContext['get']>[1]} options
   *   Playwright request options.
   * @returns {Promise<import('playwright').APIResponse>} The server response.
   * @throws {Error} When the request cannot be sent or its method is unsupported.
   */
  async send(method, path, options = {}) {
    const requestMethod = method.toUpperCase();
    const supportedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    const safePath = path.split(/[?#]/, 1)[0];

    if (!supportedMethods.includes(requestMethod)) {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const endpoint = `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
    const startedAt = performance.now();

    try {
      // Keep headers separate so it is clear which settings apply to the
      // request's headers and which settings control the request itself.
      const headers = options.headers ?? {};
      const { data, form, multipart, ...otherOptions } = options;

      // Start with common settings such as query parameters, timeouts, and
      // status-code handling. The payload options are added below only when
      // the caller has supplied them.
      const requestOptions = {
        ...otherOptions,
        headers,
      };

      // Playwright supports several body formats. Pass through whichever
      // format the caller supplied rather than converting it here.
      if (data !== undefined) {
        requestOptions.data = data;
      }

      if (form !== undefined) {
        requestOptions.form = form;
      }

      if (multipart !== undefined) {
        requestOptions.multipart = multipart;
      }

      // Use Playwright's dedicated method for each HTTP verb.
      let response;

      switch (requestMethod) {
        case 'GET':
          response = await this.requestContext.get(endpoint, requestOptions);
          break;
        case 'POST':
          response = await this.requestContext.post(endpoint, requestOptions);
          break;
        case 'PUT':
          response = await this.requestContext.put(endpoint, requestOptions);
          break;
        case 'PATCH':
          response = await this.requestContext.patch(endpoint, requestOptions);
          break;
        case 'DELETE':
          response = await this.requestContext.delete(endpoint, requestOptions);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      this.logger.info('API request completed', {
        method: requestMethod,
        endpoint: safePath,
        status: response.status(),
        durationMs: Math.round(performance.now() - startedAt),
      });
      return response;
    } catch (error) {
      this.logger.error('API request failed', {
        method: requestMethod,
        endpoint: safePath,
        errorName: error instanceof Error ? error.name : 'Error',
        durationMs: Math.round(performance.now() - startedAt),
      });
      throw new Error(
        `${method} request to "${safePath}" could not be completed. Check the API URL and network connection.`,
        { cause: error },
      );
    }
  }

  /**
   * Assert the transport-level HTTP status using Playwright's `expect`.
   * AutomationExercise also returns an application-level `responseCode` in
   * its JSON body; check that separately with `assertResponseCode`.
   *
   * @param {import('playwright').APIResponse} response Response returned by this client.
   * @param {number} expectedStatus HTTP status expected by the scenario.
   * @returns {void} Throws a Playwright assertion error when the status differs.
   */
  assertStatus(response, expectedStatus) {
    expect(response.status()).toBe(expectedStatus);
  }

  /**
   * Assert the JSON response's application-level status code. This is separate
   * from the HTTP status because the application can return HTTP 200 while
   * reporting a validation error such as `responseCode: 400`.
   *
   * @param {unknown} responseBody Parsed JSON response body.
   * @param {number} expectedCode Application response code expected by the scenario.
   * @returns {void} Throws a Playwright assertion error when the code differs.
   */
  assertResponseCode(responseBody, expectedCode) {
    expect(responseBody).toEqual(
      expect.objectContaining({
        responseCode: expectedCode,
      }),
    );
  }

  /**
   * Parse the response as JSON. API steps can then use Playwright assertions
   * against fields relevant to their scenario. Malformed bodies fail clearly
   * without printing response contents, which may contain account details.
   *
   * @param {import('playwright').APIResponse} response Response returned by this client.
   * @returns {Promise<unknown>} Parsed JSON response body.
   * @throws {Error} When the response body is not valid JSON.
   */
  async getJson(response) {
    try {
      return await response.json();
    } catch {
      throw new Error('API response body could not be parsed as JSON.');
    }
  }
}
