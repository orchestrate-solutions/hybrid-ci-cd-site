/**
 * RelayCard Component Stories
 * Storybook documentation for RelayCard component
 */

import type { Meta, StoryObj } from "@storybook/react";
import { RelayCard } from "./RelayCard";
import { Relay } from "@/lib/api/relay";

const mockRelay: Relay = {
  id: "relay-12345678",
  name: "Production Relay",
  status: "HEALTHY",
  version: "1.2.3",
  last_heartbeat: new Date().toISOString(),
  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  endpoint: "https://relay.example.com",
};

const meta = {
  component: RelayCard,
  tags: ["autodocs"],
  argTypes: {
    relay: { control: "object" },
    isLoading: { control: "boolean" },
  },
} satisfies Meta<typeof RelayCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Healthy relay card
 */
export const Healthy: Story = {
  args: {
    relay: mockRelay,
  },
};

/**
 * Degraded relay status
 */
export const Degraded: Story = {
  args: {
    relay: { ...mockRelay, status: "DEGRADED" },
  },
};

/**
 * Offline relay status
 */
export const Offline: Story = {
  args: {
    relay: { ...mockRelay, status: "OFFLINE" },
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    relay: mockRelay,
    isLoading: true,
  },
};

/**
 * Without endpoint
 */
export const WithoutEndpoint: Story = {
  args: {
    relay: { ...mockRelay, endpoint: undefined },
  },
};
