'use client';

import { useState, useEffect, useRef } from 'react';

export default function TestPDFPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(80);
  const [verticalOffset, setVerticalOffset] = useState(0.15);
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const [lineWidth, setLineWidth] = useState(14);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Center position
    const x = canvas.width / 2;
    const y = canvas.height / 2;

    // Draw green circle
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Draw white border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, size - 4, 0, Math.PI * 2);
    ctx.stroke();

    // Draw checkmark
    ctx.strokeStyle = 'white';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const checkWidth = size * 0.7;
    const vOffset = size * verticalOffset;
    const hOffset = size * horizontalOffset;

    const leftX = x - checkWidth * 0.3 + hOffset;
    const leftY = y + vOffset;
    const midX = x - checkWidth * 0.05 + hOffset;
    const midY = y + checkWidth * 0.35 + vOffset;
    const rightX = x + checkWidth * 0.4 + hOffset;
    const rightY = y - checkWidth * 0.3 + vOffset;

    ctx.beginPath();
    ctx.moveTo(leftX, leftY);
    ctx.lineTo(midX, midY);
    ctx.lineTo(rightX, rightY);
    ctx.stroke();

  }, [size, verticalOffset, horizontalOffset, lineWidth]);

  const copyCode = () => {
    const code = `const verticalOffset = size * ${verticalOffset};
const horizontalOffset = size * ${horizontalOffset};
const lineWidth = ${lineWidth / 4}; // PDF units

// In PDF generator:
const leftY = y + verticalOffset;
const midY = y + checkWidth * 0.35 + verticalOffset;
const rightY = y - checkWidth * 0.3 + verticalOffset;`;

    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          PDF Checkmark Test Environment
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Live Preview
            </h2>
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="border-2 border-gray-200 rounded-lg"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Adjust Checkmark
            </h2>

            <div className="space-y-6">
              {/* Circle Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Circle Size: {size}px
                </label>
                <input
                  type="range"
                  min="50"
                  max="120"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Vertical Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vertical Position: {verticalOffset.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="-0.3"
                  max="0.3"
                  step="0.01"
                  value={verticalOffset}
                  onChange={(e) => setVerticalOffset(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Negative = up, Positive = down
                </p>
              </div>

              {/* Horizontal Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horizontal Position: {horizontalOffset.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="-0.3"
                  max="0.3"
                  step="0.01"
                  value={horizontalOffset}
                  onChange={(e) => setHorizontalOffset(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Negative = left, Positive = right
                </p>
              </div>

              {/* Line Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Line Thickness: {lineWidth}px
                </label>
                <input
                  type="range"
                  min="8"
                  max="24"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  setSize(80);
                  setVerticalOffset(0.15);
                  setHorizontalOffset(0);
                  setLineWidth(14);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
              >
                Reset to Default
              </button>

              {/* Copy Code Button */}
              <button
                onClick={copyCode}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-lg"
              >
                Copy Code Values
              </button>
            </div>

            {/* Current Values */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-mono text-gray-600">
                verticalOffset: {verticalOffset.toFixed(2)}
              </p>
              <p className="text-xs font-mono text-gray-600">
                horizontalOffset: {horizontalOffset.toFixed(2)}
              </p>
              <p className="text-xs font-mono text-gray-600">
                lineWidth: {(lineWidth / 4).toFixed(1)} (PDF)
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            How to Use:
          </h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Adjust the sliders until the checkmark looks perfect</li>
            <li>Click "Copy Code Values" to copy the settings</li>
            <li>Update the PDF generator with the new values</li>
            <li>Test by downloading a PDF</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
