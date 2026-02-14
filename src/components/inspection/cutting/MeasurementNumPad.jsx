import React, { useState } from "react";
import { X, Check } from "lucide-react";

// Helper function to convert fraction to decimal
const fractionToDecimal = (numerator, denominator) => {
  return numerator / denominator;
};

// Helper function to convert decimal to fraction for display
const decimalToFraction = (value) => {
  if (value === 0) return "0";
  const sign = value < 0 ? "-" : "";
  const absValue = Math.abs(value);
  const whole = Math.floor(absValue);
  const decimal = absValue - whole;

  if (decimal === 0) return `${sign}${whole || 0}`;

  // Common fractions mapping
  const fractions = [
    { fraction: "1/16", value: 1 / 16 },
    { fraction: "1/8", value: 1 / 8 },
    { fraction: "3/16", value: 3 / 16 },
    { fraction: "1/4", value: 1 / 4 },
    { fraction: "5/16", value: 5 / 16 },
    { fraction: "3/8", value: 3 / 8 },
    { fraction: "7/16", value: 7 / 16 },
    { fraction: "1/2", value: 1 / 2 },
    { fraction: "9/16", value: 9 / 16 },
    { fraction: "5/8", value: 5 / 8 },
    { fraction: "11/16", value: 11 / 16 },
    { fraction: "3/4", value: 3 / 4 },
    { fraction: "13/16", value: 13 / 16 },
    { fraction: "7/8", value: 7 / 8 },
    { fraction: "15/16", value: 15 / 16 },
    { fraction: "1", value: 1 }
  ];

  const fraction = fractions.find(
    (f) => Math.abs(f.value - decimal) < 0.001
  )?.fraction;

  if (!fraction) return `${sign}${absValue.toFixed(3)}`;

  const [numerator, denominator] = fraction.split("/").map(Number);
  return whole > 0
    ? `${sign}${whole} ${numerator}/${denominator}`
    : `${sign}${numerator}/${denominator}`;
};

const MeasurementNumPad = ({ onClose, onInput, initialValue }) => {
  const [sign, setSign] = useState("-"); // Default to negative
  const [wholeNumber, setWholeNumber] = useState(0); // For the 'N' button (0 to 5)
  const [fraction, setFraction] = useState(null); // Selected fraction (e.g., "1/8")

  // 4x4 grid of fractions
  const fractions = [
    ["1/16", "1/8", "3/16", "1/4"],
    ["5/16", "3/8", "7/16", "1/2"],
    ["9/16", "5/8", "11/16", "3/4"],
    ["13/16", "7/8", "15/16", "1"]
  ];

  const handleFractionClick = (frac) => {
    setFraction(frac);
    let numerator, denominator;
    if (frac === "1") {
      numerator = 1;
      denominator = 1;
    } else {
      [numerator, denominator] = frac.split("/").map(Number);
    }
    const decimalValue = fractionToDecimal(numerator, denominator);
    const finalValue = Number(
      ((sign === "-" ? -1 : 1) * (wholeNumber + decimalValue)).toFixed(4)
    );
    let fractionValue;
    if (frac === "1" && wholeNumber >= 0) {
      fractionValue = `${sign}${wholeNumber + 1}`;
    } else {
      fractionValue = `${
        wholeNumber > 0 ? wholeNumber + " " : ""
      }${sign}${frac}`;
    }

    onInput(finalValue, fractionValue);
    onClose();
  };

  // Handle sign change
  const handleSignChange = (newSign) => {
    setSign(newSign);
  };

  // Handle whole number change (N button)
  const handleWholeNumberChange = () => {
    setWholeNumber((prev) => (prev < 5 ? prev + 1 : 0));
  };

  // Handle clear (X button)
  const handleClear = () => {
    setFraction(null);
    setWholeNumber(0);
    onClose();
  };

  // Handle zero button (bottom row)
  const handleZero = () => {
    onInput(0, "0");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg w-80">
        {/* Top Row: Sign and Control Buttons */}
        <div className="flex justify-between mb-4">
          <button
            onClick={() => handleSignChange("-")}
            className={`px-4 py-2 rounded-lg font-bold text-lg ${
              sign === "-"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            } hover:bg-blue-600 hover:text-white transition`}
          >
            -
          </button>
          <button
            onClick={() => handleSignChange("+")}
            className={`px-4 py-2 rounded-lg font-bold text-lg ${
              sign === "+"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            } hover:bg-blue-600 hover:text-white transition`}
          >
            +
          </button>
          <button
            onClick={handleWholeNumberChange}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition font-bold text-lg"
          >
            N: {wholeNumber}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4x4 Grid of Fractions */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {fractions.flat().map((frac, index) => {
            const [numerator, denominator] = frac.split("/").map(Number);
            const isWholeOne = frac === "1";
            return (
              <button
                key={index}
                onClick={() => handleFractionClick(frac)}
                className={`p-4 rounded-lg font-semibold text-lg transition ${
                  fraction === frac
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } flex flex-col items-center justify-center`}
              >
                {isWholeOne ? (
                  <span className="block">{sign}1</span>
                ) : (
                  <>
                    <span className="block">
                      {sign}
                      {numerator}
                    </span>
                    <span className="block border-t border-gray-500 w-6"></span>
                    <span className="block">{denominator}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Row: Zero Button */}
        <button
          onClick={handleZero}
          className="w-full py-4 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 transition"
        >
          0
        </button>
      </div>
    </div>
  );
};

export default MeasurementNumPad;
