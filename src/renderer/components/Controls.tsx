import React from 'react';

interface ControlsProps {
  currentContextMode: boolean;
  currentContextName: string;
  currentContextUnit: string;
  onContextModeChange: (contextMode: boolean) => void;
  onContextNameChange: (contextName: string) => void;
  onContextUnitChange: (contextUnit: string) => void;
  currentAliasName: string;
  onAliasNameChange: (aliasName: string) => void;
  starcraftHandle: string;
  parsedStrings: string[];
  isSendRunning: boolean;
  isClearRunning: boolean;
  maxClearIndex: number;
  onMaxClearIndexChange: (index: number) => void;
  onSendMessage: () => void;
  onForceSendMessage: () => void;
  onClearAlias: () => void;
  onStopAll: () => void;
  appVersion: string;
}

const Controls: React.FC<ControlsProps> = ({
  currentContextMode,
  currentContextName,
  currentContextUnit,
  onContextModeChange,
  onContextNameChange,
  onContextUnitChange,
  currentAliasName,
  onAliasNameChange,
  starcraftHandle,
  parsedStrings,
  isSendRunning,
  isClearRunning,
  maxClearIndex,
  onMaxClearIndexChange,
  onSendMessage,
  onForceSendMessage,
  onClearAlias,
  onStopAll,
  appVersion,
}) => (
  <div className="sidebar">
    <div className="sidebar-section">
      <h3>Controls</h3>
      <div className="control-item">
        <label className="control-label">
          <input
            type="checkbox"
            checked={currentContextMode}
            onChange={(e) => onContextModeChange(e.target.checked)}
            className="control-checkbox"
          />
          Use Context Mode
        </label>
      </div>
      {currentContextMode && (
        <div className="control-item">
          <label className="control-label">Context Name:</label>
          <input
            type="text"
            value={currentContextName}
            onChange={(e) => onContextNameChange(e.target.value)}
            placeholder="Enter context name"
            className="control-input"
          />
        </div>
      )}
      {currentContextMode && (
        <div className="control-item">
          <label className="control-label">Unit:</label>
          <input
            type="text"
            value={currentContextUnit}
            onChange={(e) => onContextUnitChange(e.target.value)}
            placeholder="Enter unit name"
            className="control-input"
          />
        </div>
      )}
      <div className="control-item">
        <label className="control-label">Alias Name:</label>
        <input
          type="text"
          value={currentAliasName}
          onChange={(e) => onAliasNameChange(e.target.value)}
          placeholder="Enter alias name"
          className="control-input"
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={onSendMessage}
        disabled={
          starcraftHandle === 'Not found' ||
          parsedStrings.length === 0 ||
          !currentAliasName.trim() ||
          (currentContextMode && (!currentContextName.trim() || !currentContextUnit.trim())) ||
          isSendRunning ||
          isClearRunning
        }
      >
        {isSendRunning ? (
          <>
            <span className="spinner">⏳</span>
            Sending...
          </>
        ) : (
          'Send'
        )}
      </button>
      <button
        className="btn btn-primary"
        onClick={onForceSendMessage}
        disabled={
          starcraftHandle === 'Not found' ||
          parsedStrings.length === 0 ||
          !currentAliasName.trim() ||
          (currentContextMode && (!currentContextName.trim() || !currentContextUnit.trim())) ||
          isSendRunning ||
          isClearRunning
        }
      >
        {isSendRunning ? (
          <>
            <span className="spinner">⏳</span>
            Sending...
          </>
        ) : (
          'Force Send'
        )}
      </button>
      <button
        className="btn btn-secondary"
        onClick={onClearAlias}
        disabled={
          starcraftHandle === 'Not found' ||
          !currentAliasName.trim() ||
          isSendRunning ||
          isClearRunning
        }
      >
        {isClearRunning ? (
          <>
            <span className="spinner">⏳</span>
            Clearing...
          </>
        ) : (
          'Clear Alias'
        )}
      </button>
      <div className="control-item">
        <label className="control-label">Max Clear Index:</label>
        <input
          type="number"
          value={maxClearIndex}
          onChange={(e) => onMaxClearIndexChange(parseInt(e.target.value) || 0)}
          min="0"
          max="100"
          className="control-input"
        />
      </div>
      <button
        className="btn btn-danger"
        onClick={onStopAll}
        disabled={!isSendRunning && !isClearRunning}
      >
        Stop All
      </button>
    </div>
    <div className="sidebar-section">
      <h3>App Info</h3>
      <p>Version: {appVersion}</p>
      <p>Platform: {navigator.platform}</p>
    </div>
  </div>
);

export default Controls; 