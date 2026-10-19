@api
Feature: AutomationExercise API
  @api-public
  Scenario: Verify the published product list is returned
    When the client requests the product list
    Then the API response status is 200
    And the API response application code is 200
    And the API response contains the product list

  @api-public
  Scenario: Verify product search returns matching products
    When the client searches for products matching the configured search term
    Then the API response status is 200
    And the API response application code is 200
    And the API response contains products matching the configured search term

  @api-public
  Scenario: Verify a search with no matches returns an empty product list
    When the client searches for a product with no matches
    Then the API response status is 200
    And the API response application code is 200
    And the API response contains no products

  @api-public
  Scenario: Validate search without its required parameter is rejected
    When the client searches without a product term
    Then the API response status is 200
    And the API response application code is 400
    And the API response message is "Bad request, search_product parameter is missing in POST request."

  @api-public
  Scenario: Validate an unsupported product-list method is rejected
    When the client posts to the product-list endpoint
    Then the API response status is 200
    And the API response application code is 405

  Scenario: Verify configured account credentials are accepted
    When the client verifies the configured account credentials
    Then the API response status is 200
    And the API response application code is 200
    And the API response message is "User exists!"

  Scenario: Validate login without credentials is rejected
    When the client verifies login without credentials
    Then the API response status is 200
    And the API response application code is 400
    And the API response message is "Bad request, email or password parameter is missing in POST request."

  Scenario: Verify configured account details can be retrieved by email
    When the client requests details for the configured account
    Then the API response status is 200
    And the API response application code is 200
    And the API response contains the configured account details

  Scenario: Verify an API account can be created updated retrieved and deleted
    When the client creates a unique API account
    Then the API response status is 200
    And the API response application code is 201
    And the API response message is "User created!"
    When the client updates the API account
    Then the API response status is 200
    And the API response application code is 200
    And the API response message is "User updated!"
    When the client requests details for the API account
    Then the API response status is 200
    And the API response application code is 200
    And the API response contains the updated API account details
    When the client deletes the API account
    Then the API response status is 200
    And the API response application code is 200
    And the API account deletion is confirmed