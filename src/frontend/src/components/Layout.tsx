import { JournalSwitcher } from "@/components/JournalSwitcher";
import { Landing } from "@/components/Landing";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, Outlet } from "@tanstack/react-router";
import { Flame, Menu } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/people", label: "People" },
  { to: "/vault", label: "Vault" },
  { to: "/one-day", label: "ONE DAY" },
] as const;

export function Layout() {
  const { isAuthenticated, clear } = useInternetIdentity();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card shadow-subtle">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2"
            data-ocid="brand_link"
          >
            <Flame className="size-5 text-primary" aria-hidden="true" />
            <span className="font-display text-base font-semibold tracking-tight text-gradient sm:text-lg">
              BEFORE WE DIE
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            data-ocid="nav"
            aria-label="Primary"
          >
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                activeProps={{
                  className: "bg-accent text-accent-foreground hover:bg-accent",
                }}
                data-ocid={`nav_link_${item.label
                  .toLowerCase()
                  .replace(/\s+/g, "_")}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <JournalSwitcher />
            <button
              type="button"
              onClick={clear}
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:inline-flex"
              data-ocid="logout_button"
            >
              Sign out
            </button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                  data-ocid="mobile_menu_button"
                >
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="font-display text-base tracking-tight text-gradient">
                    BEFORE WE DIE
                  </SheetTitle>
                </SheetHeader>
                <nav
                  className="flex flex-col gap-1 px-2"
                  aria-label="Mobile"
                  data-ocid="mobile_nav"
                >
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      activeProps={{
                        className:
                          "bg-accent text-accent-foreground hover:bg-accent",
                      }}
                      data-ocid={`mobile_nav_link_${item.label
                        .toLowerCase()
                        .replace(/\s+/g, "_")}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto border-t px-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      clear();
                    }}
                    className="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    data-ocid="mobile_logout_button"
                  >
                    Sign out
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-background">
        <Outlet />
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()}. Built by {"  "}
            <a
              href={`https://www.youtube.com/@notsavages${encodeURIComponent(
                window.location.hostname,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              NOT SAVAGES
            </a>
            .
          </span>
          <span className="font-display italic text-muted-foreground">
            Before we die, we live.
          </span>
        </div>
      </footer>
    </div>
  );
}
