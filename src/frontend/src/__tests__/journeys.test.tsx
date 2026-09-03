import { Principal } from "@icp-sdk/core/principal";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// The app's main.tsx installs this polyfill so TanStack Query can hash query
// keys that contain bigint journal/item ids. The test harness renders pages
// directly (not through main.tsx), so install it here too.
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Radix Select uses pointer-capture APIs that jsdom does not implement.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

// The generated backend bindings import @caffeineai/object-storage, whose
// dist/index.js references a ./blob module that is not resolvable in the
// jsdom test environment. The frontend journeys do not exercise object
// storage, so we stub the module to let the app tree load.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: class ExternalBlob {},
}));

import { Dashboard } from "../pages/Dashboard";
import { OneDay } from "../pages/OneDay";
import { People } from "../pages/People";
import { Vault } from "../pages/Vault";
import {
  type MockActorState,
  createMockActor,
  freshState,
  makeItem,
  makeJournal,
  makeMember,
  renderPage,
} from "./test-utils";

const OWNER = Principal.anonymous();
const MEMBER = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");

let state: MockActorState;
let actor: ReturnType<typeof createMockActor>;

vi.mock("@caffeineai/core-infrastructure", () => ({
  InternetIdentityProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="ii-provider">{children}</div>
  ),
  useActor: () => ({ actor, isFetching: false }),
  useInternetIdentity: () => ({
    isAuthenticated: true,
    clear: () => {},
    login: () => {},
    isLoggingIn: false,
    identity: {
      getPrincipal: () => OWNER,
    },
  }),
}));

beforeEach(() => {
  state = freshState();
  actor = createMockActor(state, OWNER);
});

afterEach(() => {
  cleanup();
});

describe("dashboard journey", () => {
  it("creates a journal and adds a bucket-list item visible on the dashboard", async () => {
    const user = userEvent.setup();
    renderPage(<Dashboard />);

    // Empty state prompts to create the first journal.
    expect(await screen.findByText(/No journals yet/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /create your first journal/i }),
    );
    await user.type(screen.getByLabelText(/title/i), "The Last Light");
    await user.type(
      screen.getByLabelText(/description/i),
      "Dreams before the end",
    );
    await user.click(screen.getByRole("button", { name: /create journal/i }));

    // The new journal appears as a card and becomes the active journal. The
    // title and description show both in the journal card and the dashboard
    // header once it is active, so match all occurrences.
    expect(
      (await screen.findAllByText("The Last Light")).length,
    ).toBeGreaterThan(0);
    expect(
      (await screen.findAllByText("Dreams before the end")).length,
    ).toBeGreaterThan(0);

    // Add a bucket-list item.
    await user.click(screen.getByRole("button", { name: /add dream/i }));
    await user.type(
      screen.getByLabelText(/title/i),
      "See the aurora from an igloo",
    );
    await user.click(screen.getByRole("button", { name: /add dream/i }));

    expect(
      await screen.findByText("See the aurora from an igloo"),
    ).toBeInTheDocument();
    expect(screen.getByText(/0\/1 done/i)).toBeInTheDocument();
  });

  it("shows journal cards with member count and progress", async () => {
    state.journals.push(
      makeJournal(1n, "Adventure", OWNER, "", [
        makeMember(MEMBER, "member" as never),
      ]),
    );
    state.itemsByJournal.set(1n, [
      makeItem(1n, 1n, "Climb a mountain", "", true),
      makeItem(2n, 1n, "Swim with whales"),
    ]);

    renderPage(<Dashboard />);

    expect(await screen.findByText("Adventure")).toBeInTheDocument();
    // owner + 1 member
    expect(screen.getByText(/2 members/i)).toBeInTheDocument();
    // The card's progress query resolves after the journal card renders.
    expect(await screen.findByText(/1\/2 done/i)).toBeInTheDocument();
  });
});

describe("journal switcher", () => {
  it("switches the active journal and updates the dashboard list", async () => {
    const user = userEvent.setup();
    state.journals.push(makeJournal(1n, "Alpha", OWNER));
    state.journals.push(makeJournal(2n, "Beta", OWNER));
    state.itemsByJournal.set(1n, [makeItem(1n, 1n, "Alpha dream")]);
    state.itemsByJournal.set(2n, [makeItem(2n, 2n, "Beta dream")]);

    renderPage(<Dashboard />);

    // Select the second journal via its dashboard card.
    await user.click(await screen.findByText("Beta"));

    // The dashboard bucket list now reflects the active journal.
    expect(await screen.findByText("Beta dream")).toBeInTheDocument();
    expect(screen.queryByText("Alpha dream")).not.toBeInTheDocument();
  });
});

describe("people page", () => {
  it("lists members and generates a copyable invitation link", async () => {
    const user = userEvent.setup();
    state.journals.push(makeJournal(1n, "Adventure", OWNER));
    state.membersByJournal.set(1n, [makeMember(MEMBER, "member" as never)]);

    renderPage(<People />, 1n);

    // Owner and member both appear.
    expect(await screen.findByText(/2 total/i)).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Member")).toBeInTheDocument();

    // Generate an invite link and reveal it inline.
    await user.click(
      screen.getByRole("button", { name: /generate invite link/i }),
    );
    const link = await screen.findByText(/join\?code=invite-1/);
    expect(link.textContent).toContain("/join?code=invite-1");
  });
});

describe("vault page", () => {
  it("shows vaulted items and returns them to the list", async () => {
    const user = userEvent.setup();
    state.journals.push(makeJournal(1n, "Adventure", OWNER));
    state.itemsByJournal.set(1n, [
      makeItem(1n, 1n, "Secret wish", "", false, true),
      makeItem(2n, 1n, "Public dream"),
    ]);

    renderPage(<Vault />, 1n);

    // Only the vaulted item shows.
    expect(await screen.findByText("Secret wish")).toBeInTheDocument();
    expect(screen.queryByText("Public dream")).not.toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    // Return it to the list.
    await user.click(
      screen.getByRole("button", { name: /return to the list/i }),
    );
    await waitFor(() => {
      expect(screen.getByText(/the vault is empty/i)).toBeInTheDocument();
    });
  });
});

describe("one day page", () => {
  it("renders a slideshow with prev/next controls", async () => {
    const user = userEvent.setup();
    state.journals.push(makeJournal(1n, "Adventure", OWNER));
    state.itemsByJournal.set(1n, [
      makeItem(1n, 1n, "First dream"),
      makeItem(2n, 1n, "Second dream"),
    ]);

    renderPage(<OneDay />, 1n);

    const slideshow = await screen.findByLabelText(
      /ONE DAY cinematic slideshow/i,
    );
    expect(slideshow).toBeInTheDocument();

    // First slide is shown (wait for the bucket-list query to resolve).
    expect(
      await within(slideshow).findByText("First dream"),
    ).toBeInTheDocument();

    // Next advances to the second slide (AnimatePresence waits for the exit
    // animation, so wait for the new slide to enter).
    await user.click(screen.getByRole("button", { name: /next slide/i }));
    expect(
      await within(slideshow).findByText("Second dream"),
    ).toBeInTheDocument();

    // Prev returns to the first slide.
    await user.click(screen.getByRole("button", { name: /previous slide/i }));
    expect(
      await within(slideshow).findByText("First dream"),
    ).toBeInTheDocument();
  });
});
