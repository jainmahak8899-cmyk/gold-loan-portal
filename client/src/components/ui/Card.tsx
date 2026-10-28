import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function Card({ children, className = "", onClick, selected }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border-2 transition-all duration-200
        ${onClick ? "cursor-pointer hover:shadow-md" : ""}
        ${selected ? "border-amber-500 shadow-amber-100 shadow-md" : "border-gray-100"}
        ${className}`}
    >
      {children}
    </div>
  );
}
