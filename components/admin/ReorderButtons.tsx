"use client";

import { FiChevronDown, FiChevronUp } from "react-icons/fi";

type ReorderButtonsProps = {
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableUp?: boolean;
  disableDown?: boolean;
  saving?: boolean;
};

export default function ReorderButtons({
  onMoveUp,
  onMoveDown,
  disableUp,
  disableDown,
  saving,
}: ReorderButtonsProps) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={disableUp || saving}
        className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30"
        title="Move up"
      >
        <FiChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={disableDown || saving}
        className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30"
        title="Move down"
      >
        <FiChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

export function assignSortOrders<T extends { id: string }>(items: T[]): { id: string; sortOrder: number }[] {
  return items.map((item, index) => ({
    id: item.id,
    sortOrder: index * 10,
  }));
}

export function moveItem<T>(items: T[], index: number, direction: "up" | "down"): T[] {
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
