import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import App from "../App";

// The generated backend bindings import @caffeineai/object-storage, whose
// dist/index.js references a ./blob module that is not resolvable in the
// jsdom test environment. The app shell does not exercise object storage, so
// we stub the module to let the provider tree load.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: class ExternalBlob {},
}));

// The InternetIdentityProvider is an external auth provider that requires a
// live auth context / network. The app shell's stable contract is that it
// composes QueryClientProvider + InternetIdentityProvider around <App />
// without crashing, so we stub the auth provider and assert the shell mounts.
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

function renderShell() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        <App />
      </InternetIdentityProvider>
    </QueryClientProvider>,
  );
}

describe("app shell", () => {
  it("mounts the provider tree without crashing", () => {
    expect(() => renderShell()).not.toThrow();
  });

  it("wraps the app in the InternetIdentity provider", () => {
    const { container } = renderShell();
    expect(
      container.querySelector('[data-testid="ii-provider"]'),
    ).not.toBeNull();
  });
});
