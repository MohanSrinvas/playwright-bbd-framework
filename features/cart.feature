@ui @cart @regression
Feature: Shopping cart

  Scenario: Verify the user can add and remove a product
    Given the user opens the product catalog directly
    When the user searches for the product in test data
    And the user adds the matching product to the cart
    Then the add-to-cart confirmation is displayed
    When the user opens the cart from the confirmation
    Then the cart contains the product in test data
    When the user removes the product in test data from the cart
    Then the cart is empty