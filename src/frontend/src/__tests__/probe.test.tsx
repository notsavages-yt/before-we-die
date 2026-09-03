import { cleanup, screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// The generated backend bindings import @caffeineai/object-storage, whose
// dist/index.js references a ./blob module that is not resolvable in the
// jsdom test environment. The landing page does not exercise object storage,
// so we stub the module to let the app tree load.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: class ExternalBlob {},
}));

import { Landing } from "../components/Landing";

// The InternetIdentityProvider is an external auth provider that requires a
// live auth context / network. The landing page's stable contract is that it
// renders the sign-in call-to-action for an unauthenticated visitor, so we
// stub the auth hook and assert the landing experience.
vi.mock("@caffeineai/core-infrastructure", () => ({
  InternetIdentityProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="ii-provider">{children}</div>
  ),
  useActor: () => ({ actor: null, isFetching: false }),
  useInternetIdentity: () => ({
    isAuthenticated: false,
    clear: () => {},
    login: () => {},
    isLoggingIn: false,
    identity: null,
  }),
}));

afterEach(() => {
  cleanup();
});

describe("landing", () => {
  it("shows the brand and a sign-in call to action for unauthenticated visitors", () => {
    render(<Landing />);
    // The brand phrase appears in the header, hero, and footer.
    expect(screen.getAllByText(/BEFORE WE DIE/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /begin the list/i }),
    ).toBeInTheDocument();
  });
});
