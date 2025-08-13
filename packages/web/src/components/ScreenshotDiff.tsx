import { useState } from 'react';

interface ScreenshotDiffProps {
  beforeImage?: string;
  afterImage?: string;
  failureImage: string;
  title?: string;
}

export default function ScreenshotDiff({ beforeImage, afterImage, failureImage, title = "Screenshot Analysis" }: ScreenshotDiffProps) {
  const [activeTab, setActiveTab] = useState<'failure' | 'before' | 'after'>('failure');

  const tabs = [
    { key: 'failure', label: 'At Failure', image: failureImage },
    ...(beforeImage ? [{ key: 'before' as const, label: 'Before', image: beforeImage }] : []),
    ...(afterImage ? [{ key: 'after' as const, label: 'After', image: afterImage }] : []),
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-800">{title}</h4>
      
      {/* Tab Navigation */}
      {tabs.length > 1 && (
        <div className="flex space-x-1 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Image Display */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        {tabs.find(tab => tab.key === activeTab)?.image ? (
          <img
            src={tabs.find(tab => tab.key === activeTab)?.image}
            alt={`Screenshot ${activeTab}`}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="bg-gray-100 h-48 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <i className="fas fa-image text-4xl mb-2"></i>
              <div className="text-sm">Screenshot: 1920x1080</div>
              <div className="text-xs">Captured at {activeTab} point</div>
            </div>
          </div>
        )}
      </div>

      {/* Image Controls */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <div className="flex items-center space-x-4">
          <span>Viewport: 1920x1080</span>
          <span>•</span>
          <span>Browser: Chrome 120</span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="text-blue-600 hover:text-blue-700">
            <i className="fas fa-download mr-1"></i>
            Download
          </button>
          <button className="text-blue-600 hover:text-blue-700">
            <i className="fas fa-expand mr-1"></i>
            Fullscreen
          </button>
        </div>
      </div>

      {/* Diff Analysis (if multiple images) */}
      {tabs.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
            <div className="text-sm text-blue-800">
              <div className="font-medium">Visual Differences Detected</div>
              <div className="mt-1">
                The element location or styling appears to have changed between captures.
                This might explain why the original selector failed.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
