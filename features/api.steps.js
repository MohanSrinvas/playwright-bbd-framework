import { Then, When } from '@cucumber/cucumber';
import { expect } from 'playwright/test';
import apiEndpoints from '../src/api/api-endpoints.json' with { type: 'json' };
import { createUniqueEmail } from '../utils/common-utils.js';

When('the client requests the product list', async function () {
  this.apiResponse = await this.apiClient.get(apiEndpoints.productsList);
});

When('the client searches for products matching the configured search term', async function () {
  this.apiResponse = await this.apiClient.post(apiEndpoints.searchProduct, {
    headers: { Accept: 'application/json' },
    form: { search_product: this.testData.api.search.matchingTerm },
  });
});

When('the client searches for a product with no matches', async function () {
  this.apiResponse = await this.apiClient.post(apiEndpoints.searchProduct, {
    headers: { Accept: 'application/json' },
    form: { search_product: this.testData.api.search.noMatchTerm },
  });
});

When('the client searches without a product term', async function () {
  this.apiResponse = await this.apiClient.post(apiEndpoints.searchProduct, {
    headers: { Accept: 'application/json' },
    form: {},
  });
});

When('the client posts to the product-list endpoint', async function () {
  this.apiResponse = await this.apiClient.post(apiEndpoints.productsList);
});

When('the client verifies the configured account credentials', async function () {
  const credentials = getApiCredentials();
  this.apiResponse = await this.apiClient.post(apiEndpoints.verifyLogin, {
    headers: { Accept: 'application/json' },
    form: {
      email: credentials.username,
      password: credentials.password,
    },
  });
});

When('the client verifies login without credentials', async function () {
  this.apiResponse = await this.apiClient.post(apiEndpoints.verifyLogin, {
    headers: { Accept: 'application/json' },
    form: {},
  });
});

When('the client requests details for the configured account', async function () {
  const credentials = getApiCredentials();
  this.apiResponse = await this.apiClient.get(apiEndpoints.getUserDetailByEmail, {
    params: { email: credentials.username },
  });
});

When('the client creates a unique API account', async function () {
  this.apiAccountEmail = createUniqueEmail('playwright.api');
  this.apiAccountPassword = this.testData.api.account.password;
  this.apiAccountName = this.testData.api.account.details.name;

  this.apiResponse = await this.apiClient.post(apiEndpoints.createAccount, {
    headers: { Accept: 'application/json' },
    form: {
      ...this.testData.api.account.details,
      email: this.apiAccountEmail,
      password: this.apiAccountPassword,
    },
  });

  this.apiClient.assertStatus(this.apiResponse, 200);
  const responseBody = await this.apiClient.getJson(this.apiResponse);
  this.apiClient.assertResponseCode(responseBody, 201);
  this.apiAccountCreated = true;
});

When('the client updates the API account', async function () {
  this.apiResponse = await this.apiClient.put(apiEndpoints.updateAccount, {
    headers: { Accept: 'application/json' },
    form: {
      ...this.testData.api.account.details,
      firstname: this.testData.api.account.updatedFirstname,
      email: this.apiAccountEmail,
      password: this.apiAccountPassword,
    },
  });
});

When('the client requests details for the API account', async function () {
  this.apiResponse = await this.apiClient.get(apiEndpoints.getUserDetailByEmail, {
    params: { email: this.apiAccountEmail },
  });
});

When('the client deletes the API account', async function () {
  this.apiResponse = await this.apiClient.delete(apiEndpoints.deleteAccount, {
    headers: { Accept: 'application/json' },
    form: {
      email: this.apiAccountEmail,
      password: this.apiAccountPassword,
    },
  });
});

Then('the API response status is {int}', function (expectedStatus) {
  this.apiClient.assertStatus(this.apiResponse, expectedStatus);
});

Then('the API response application code is {int}', async function (expectedCode) {
  const responseBody = await this.apiClient.getJson(this.apiResponse);
  this.apiClient.assertResponseCode(responseBody, expectedCode);

  if (this.apiAccountCreated && this.apiResponse.url().endsWith(apiEndpoints.deleteAccount)) {
    this.apiAccountCreated = false;
  }
});

Then('the API response message is {string}', async function (expectedMessage) {
  const responseBody = await this.apiClient.getJson(this.apiResponse);
  expect(responseBody.message).toBe(expectedMessage);
});

Then('the API response contains the product list', async function () {
  const responseBody = await this.apiClient.getJson(this.apiResponse);

  expect(responseBody).toEqual(
    expect.objectContaining({
      responseCode: 200,
      products: expect.any(Array),
    }),
  );
  expect(responseBody.products.length).toBeGreaterThan(0);
});

Then('the API response contains products matching the configured search term', async function () {
  const responseBody = await this.apiClient.getJson(this.apiResponse);
  const searchTerm = this.testData.api.search.matchingTerm.toLowerCase();

  expect(responseBody.products.length).toBeGreaterThan(0);
  expect(
    responseBody.products.some((product) => product.name.toLowerCase().includes(searchTerm)),
  ).toBe(true);
});

Then('the API response contains no products', async function () {
  const responseBody = await this.apiClient.getJson(this.apiResponse);
  expect(responseBody.products).toEqual([]);
});

Then('the API response contains the configured account details', async function () {
  const credentials = getApiCredentials();
  const responseBody = await this.apiClient.getJson(this.apiResponse);

  expect(responseBody.user).toEqual(
    expect.objectContaining({
      email: credentials.username,
    }),
  );
});

Then('the API response contains the updated API account details', async function () {
  const responseBody = await this.apiClient.getJson(this.apiResponse);

  expect(responseBody.user).toEqual(
    expect.objectContaining({
      email: this.apiAccountEmail,
      first_name: this.testData.api.account.updatedFirstname,
    }),
  );
});

Then('the API response contains the API account details', async function () {
  const responseBody = await this.apiClient.getJson(this.apiResponse);

  expect(responseBody.user).toEqual(
    expect.objectContaining({
      email: this.apiAccountEmail,
      first_name: this.testData.api.account.details.firstname,
    }),
  );
});

Then('the API account deletion is confirmed', async function () {
  const responseBody = await this.apiClient.getJson(this.apiResponse);
  expect(responseBody.message).toBe('Account deleted!');
  this.apiAccountCreated = false;
});

/**
 * Read the valid AutomationExercise credentials from the ignored local `.env`.
 *
 * @returns {{username: string, password: string}} Configured account credentials.
 * @throws {Error} When the required environment values are missing or invalid.
 */
function getApiCredentials() {
  const username = process.env.API_USERNAME;
  const password = process.env.API_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'Set API_USERNAME and API_PASSWORD in your local .env file to run credential-based API scenarios.',
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
    throw new Error(
      'API_USERNAME must be the email address of a valid AutomationExercise account.',
    );
  }

  return { username, password };
}
