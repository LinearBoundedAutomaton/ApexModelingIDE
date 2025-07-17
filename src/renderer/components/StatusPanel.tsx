import React from 'react';

interface StatusPanelProps {
  currentFileContent: string;
  parsedStrings: string[];
  starcraftHandle: string;
  onIdentifyWindow: () => void;
  onSendEnter: () => void;
  onStartPeriodicEnter: () => void;
  onStopPeriodicEnter: () => void;
  periodicEnterInterval: number;
  onPeriodicEnterIntervalChange: (interval: number) => void;
  isPeriodicEnterRunning: boolean;
  appVersion: string;
}

const StatusPanel: React.FC<StatusPanelProps> = ({
  currentFileContent,
  parsedStrings,
  starcraftHandle,
  onIdentifyWindow,
  onSendEnter,
  onStartPeriodicEnter,
  onStopPeriodicEnter,
  periodicEnterInterval,
  onPeriodicEnterIntervalChange,
  isPeriodicEnterRunning,
  appVersion,
}) => (
  <div className="stats-panel">
    <div className="stats-header">
      <h3>Status</h3>
    </div>
    <div className="stats-content">
      <div className="stat-item">
        <span className="stat-label">Characters:</span>
        <span className="stat-value">{currentFileContent.length}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Alias Count:</span>
        <span className="stat-value">{parsedStrings.length}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Starcraft II Handle:</span>
        <span className="stat-value">{starcraftHandle}</span>
      </div>
      <button className="btn btn-secondary" onClick={onIdentifyWindow}>
        Identify Window
      </button>
      <button className="btn btn-secondary" onClick={onSendEnter}>
        Send Enter
      </button>
      <button
        className="btn btn-secondary"
        onClick={onStartPeriodicEnter}
        disabled={isPeriodicEnterRunning || starcraftHandle === 'Not found'}
      >
        {isPeriodicEnterRunning ? (
          <>
            <span className="spinner">⏳</span>
            Running...
          </>
        ) : (
          'Start Periodic Enter/Escape'
        )}
      </button>
      <button
        className="btn btn-secondary"
        onClick={onStopPeriodicEnter}
        disabled={!isPeriodicEnterRunning}
      >
        {isPeriodicEnterRunning ? 'Stop Periodic Enter/Escape' : 'Periodic Enter/Escape Stopped'}
      </button>
      <div className="control-item">
        <label className="control-label">Periodic Enter/Escape Interval (seconds):</label>
        <input
          type="number"
          value={periodicEnterInterval}
          onChange={e => onPeriodicEnterIntervalChange(parseInt(e.target.value) || 1)}
          min="1"
          max="300"
          className="control-input"
          disabled={isPeriodicEnterRunning}
        />
      </div>
    </div>
  </div>
);

export default StatusPanel;
