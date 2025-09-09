"use client";

import React from "react";

export interface ControlBarProps {
  children: React.ReactNode;
}

export function ControlBar({ children }: ControlBarProps) {
  return (
    <div className="z-20 fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="mx-auto max-w-5xl flex items-center gap-4">
        {children}
      </div>
    </div>
  );
}
