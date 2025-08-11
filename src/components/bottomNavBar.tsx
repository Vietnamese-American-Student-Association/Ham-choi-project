"use client";

import React, { useState, type HTMLAttributes } from "react";
import { FaTrophy, FaGamepad, FaClipboardList, FaUserShield } from "react-icons/fa";

export type Tab = "leaderboard" | "game" | "log" | "officer";

type TabItem = {
  key: Tab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>; // Fix the type
};

const tabConfig: readonly TabItem[] = [
  { key: "leaderboard", label: "Leaderboard", icon: FaTrophy as React.ComponentType<{ size?: number; className?: string }> },
  { key: "game",        label: "Game",        icon: FaGamepad as React.ComponentType<{ size?: number; className?: string }> },
  { key: "officer",     label: "Officer",     icon: FaUserShield as React.ComponentType<{ size?: number; className?: string }> },
  { key: "log",         label: "Log",         icon: FaClipboardList as React.ComponentType<{ size?: number; className?: string }> },
] as const;

export interface BottomNavBarProps extends HTMLAttributes<HTMLElement> {
  onTabChange?: (tab: Tab) => void;
  initialTab?: Tab;
}

export default function BottomNavBar({
  onTabChange,
  initialTab = "leaderboard",
  style,
  ...rest
}: BottomNavBarProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <nav
      role="navigation"
      aria-label="Bottom navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: "#fff",
        borderTop: "1px solid #e0e0e0",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom)",
        ...style,
      }}
      {...rest}
    >
      {tabConfig.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => handleTabClick(key)}
            aria-pressed={isActive}
            aria-label={label}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: isActive ? "#1976d2" : "#757575",
              fontWeight: isActive ? 700 : 400,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}