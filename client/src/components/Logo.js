import React from "react";

const Logo = ({ size = 32, color = "#1e40af" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
    >
      {/* Clipboard outline */}
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        ry="2"
        stroke={color}
        strokeWidth="2"
        fill="white"
      />
      {/* Top clip */}
      <path
        d="M9 3h6v2H9z"
        fill={color}
      />
      {/* Checkmark */}
      <path
        d="M8 12l3 3 5-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Logo;
