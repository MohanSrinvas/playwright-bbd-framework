@ui @products @regression @parallel 
Feature: Product catalog
  @products1
  @parallel
  Scenario: Verify the user can search for a product
    Given the user opens the product catalog directly
    When the user searches for the product in test data
    Then the matching product is displayed

  Scenario: Validate a search with no matches returns no products
    Given the user opens the product catalog directly
    When the user searches for a term with no matches
    Then no matching products are displayed

  Scenario: Verify the user can open product details
    Given the user opens the product catalog directly
    When the user searches for the product in test data
    And the user opens the matching product details
    Then the product details are displayed