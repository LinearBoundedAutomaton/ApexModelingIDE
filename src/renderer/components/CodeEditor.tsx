import React from 'react';

interface Tab {
  id: string;
  name: string;
  content: string;
  aliasName: string;
  contextMode: boolean;
  contextName: string;
  contextUnit: string;
}

interface CodeEditorProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabContentChange: (content: string) => void;
  onCreateTab: () => void;
  onDeleteTab: (tabId: string) => void;
  parsedStrings: string[];
  debounceTimeout: NodeJS.Timeout | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  onTabContentChange,
  onCreateTab,
  onDeleteTab,
  parsedStrings,
  debounceTimeout,
}) => {
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  return (
    <div className="editor-area">
      <div className="editor-header">
        <h2>Code Editor</h2>
        <div className="editor-tabs">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span>{tab.name}</span>
              {tab.content.trim() === '' && tabs.length > 1 && (
                <button
                  className="tab-close"
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteTab(tab.id);
                  }}
                  title="Close tab"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            className="tab-add"
            onClick={onCreateTab}
            title="Add new tab"
          >
            +
          </button>
        </div>
      </div>
      <div className="editor-content">
        <textarea
          value={activeTab.content}
          onChange={e => onTabContentChange(e.target.value)}
          placeholder="Start coding your Apex model here..."
          className="code-editor"
        />
      </div>
      <div className="alias-area">
        <div className="alias-header">
          <h2>Parsed Strings ({parsedStrings.length} entries)</h2>
          {debounceTimeout && <span className="parsing-indicator">Parsing...</span>}
        </div>
        <div className="alias-content">
          <textarea
            value={parsedStrings.map((str, idx) => `[${idx + 1}] (${str.length} chars): ${str}`).join('\n')}
            readOnly
            placeholder="Parsed strings will appear here..."
            className="alias-editor"
          />
        </div>
      </div>
    </div>
  );
};

export default CodeEditor; 