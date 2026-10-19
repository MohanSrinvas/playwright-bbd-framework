@retry-demo
Feature: Cucumber scenario retry demonstration

  Scenario: A transient failure passes on the retry
    Then the simulated temporary condition is available
