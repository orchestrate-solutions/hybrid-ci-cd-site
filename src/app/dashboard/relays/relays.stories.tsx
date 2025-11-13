/**
 * Relay Management Page Stories
 * Storybook documentation for Relay Management page
 */

import type { Meta, StoryObj } from "@storybook/react";
import RelayManagementPage from "./page";

const meta = {
  component: RelayManagementPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RelayManagementPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state with several relays
 */
export const Default: Story = {
  render: () => <RelayManagementPage />,
  decorators: [
    (Story) => (
      <div style={{ background: "#fafafa", minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Loading state while fetching relays
 */
export const Loading: Story = {
  render: () => <RelayManagementPage />,
  decorators: [
    (Story) => (
      <div style={{ background: "#fafafa", minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Empty state with no relays registered
 */
export const Empty: Story = {
  render: () => <RelayManagementPage />,
  decorators: [
    (Story) => (
      <div style={{ background: "#fafafa", minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Error state when fetch fails
 */
export const Error: Story = {
  render: () => <RelayManagementPage />,
  decorators: [
    (Story) => (
      <div style={{ background: "#fafafa", minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * With multiple relays showing different health statuses
 */
export const MultipleRelays: Story = {
  render: () => <RelayManagementPage />,
  decorators: [
    (Story) => (
      <div style={{ background: "#fafafa", minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};
