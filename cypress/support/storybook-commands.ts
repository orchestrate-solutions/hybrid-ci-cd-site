/**
 * Cypress Support: Storybook Navigation Helper
 * Custom command to navigate to Storybook stories
 */

Cypress.Commands.add('navigate_to_story', (storyPath: string) => {
  // Convert story path to Storybook URL format
  // Input: "components-fields-textfield--default"
  // Output: "http://localhost:6006/?path=/story/components-fields-textfield--default"
  
  const storyUrl = `http://localhost:6006/?path=/story/${storyPath}`;
  cy.visit(storyUrl, {
    failOnStatusCode: false, // Don't fail if story doesn't exist yet
    timeout: 10000,
  });
  
  // Wait for story to load
  cy.get('[role="main"]', { timeout: 5000 }).should('exist');
});

// Suppress TypeScript errors for custom commands
declare namespace Cypress {
  interface Chainable {
    navigate_to_story(storyPath: string): Chainable<void>;
  }
}
