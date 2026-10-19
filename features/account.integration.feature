@integration @ui @api @account
Feature: API-created account can sign in through the UI

  Scenario: Create an account through the API, sign in through the UI, and delete it through the API
    When the client creates a unique API account
    Then the API response status is 200
    And the API response application code is 201
    And the API response message is "User created!"
    When the user logs in with the API-created account
    Then the API-created account is shown as logged in
    When the client requests details for the API account
    Then the API response status is 200
    And the API response application code is 200
    And the API response contains the API account details
    When the client deletes the API account
    Then the API response status is 200
    And the API response application code is 200
    And the API account deletion is confirmed
