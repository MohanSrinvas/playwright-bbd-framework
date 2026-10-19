@ui @smoke
Feature: AutomationExercise home page

  @parallel
  Scenario: Verify the user can open the home page and product catalog
    Given the user opens the AutomationExercise home page
    Then the AutomationExercise home page is displayed
    When the user opens the product catalog
    Then the product catalog is displayed

  @parallel
  Scenario: Verify the user can navigate from the home page to an empty cart
    Given the user opens the AutomationExercise home page
    When the user opens the shopping cart
    Then the cart is empty
