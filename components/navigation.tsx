"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/wallet-connect";
import { useAccount } from "wagmi";
import { BookOpen, Sparkles, Menu, X, Coins, User } from "lucide-react";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected } = useAccount();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            MakeMeFamous
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/tokens"
            className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            <Coins className="h-4 w-4" />
            Tokens
          </Link>
          <Link
            href="/fame"
            className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Fame
          </Link>
          {isConnected && (
            <Link
              href="/profile"
              className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <WalletConnect />
          <Link href="/create">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Create Token
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link
              href="/tokens"
              className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Coins className="h-4 w-4" />
              Tokens
            </Link>
            <Link
              href="/fame"
              className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <BookOpen className="h-4 w-4" />
              Fame
            </Link>
            {isConnected && (
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
            )}
            <Link href="/create" onClick={() => setIsOpen(false)}>
              <Button className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                Create Token
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
