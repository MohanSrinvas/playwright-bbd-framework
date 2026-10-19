@ui @login @regression
Feature: User login

  Scenario: Validate invalid credentials are rejected
    Given the user is on the login page
    When the user submits invalid credentials
    Then the login error is displayed

  Scenario: Validate login credentials are required
    Given the user is on the login page
    When the user submits the login form without credentials
    Then the email and password fields are required

  @account
  Scenario: Verify the user can log in and delete the temporary account
    Given the user registers with the account data
    When the user signs out and logs in with the new account
    Then the account is shown as logged in
    When the user deletes the account
    Then the account deletion confirmation is displayed