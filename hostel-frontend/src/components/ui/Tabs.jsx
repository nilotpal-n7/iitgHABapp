import React from "react";

export default function Tabs({ items, value, onChange, className = "" }) {
  return (
    <div className={`flex space-x-2 ${className}`}>
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            value === it.value
              ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
