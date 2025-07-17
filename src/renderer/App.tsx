import React, { useState, useEffect } from 'react'
import './App.css'
import Controls from './components/Controls'
import CodeEditor from './components/CodeEditor'
import StatusPanel from './components/StatusPanel'

function App() {
  const [appVersion, setAppVersion] = useState<string>('')
  const [fileContent, setFileContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [starcraftHandle, setStarcraftHandle] = useState<string>('Not found')

  const [maxClearIndex, setMaxClearIndex] = useState<number>(10)
  const [parsedStrings, setParsedStrings] = useState<string[]>([])
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null)
  const [lastSentStrings, setLastSentStrings] = useState<string[]>([])
  const [isSendRunning, setIsSendRunning] = useState<boolean>(false)
  const [isClearRunning, setIsClearRunning] = useState<boolean>(false)
  const [shouldStop, setShouldStop] = useState<boolean>(false)
  const [isPeriodicEnterRunning, setIsPeriodicEnterRunning] = useState<boolean>(false)
  const [periodicEnterInterval, setPeriodicEnterInterval] = useState<number>(5)
  const [periodicEnterIntervalId, setPeriodicEnterIntervalId] = useState<NodeJS.Timeout | null>(null)
  const [tabs, setTabs] = useState<Array<{ 
    id: string; 
    name: string; 
    content: string; 
    aliasName: string;
    contextMode: boolean;
    contextName: string;
    contextUnit: string;
  }>>([
    { id: '1', name: 'Tab 1', content: '', aliasName: '', contextMode: false, contextName: '', contextUnit: '' }
  ])
  const [activeTabId, setActiveTabId] = useState<string>('1')

  useEffect(() => {
    // Get app version when component mounts
    if (window.electronAPI) {
      window.electronAPI.getAppVersion().then(version => {
        setAppVersion(version)
      }).catch(err => {
        console.error('Failed to get app version:', err)
        setAppVersion('Unknown')
      })
    }
  }, [])

  // Cleanup effect for periodic interval
  useEffect(() => {
    return () => {
      if (periodicEnterIntervalId) {
        clearInterval(periodicEnterIntervalId);
      }
    };
  }, [periodicEnterIntervalId]);

  // Get current active tab content and settings
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0]
  const currentFileContent = activeTab.content
  const currentAliasName = activeTab.aliasName
  const currentContextMode = activeTab.contextMode
  const currentContextName = activeTab.contextName
  const currentContextUnit = activeTab.contextUnit

  // Debounced update of parsed strings whenever current file content or alias name changes
  useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set a new timeout to parse after 500ms of no typing
    const timeout = setTimeout(() => {
      const parsed = parseCodeContent(currentFileContent);
      const withAliases = addAliasCommands(parsed, currentAliasName);
      setParsedStrings(withAliases);
    }, 500);

    setDebounceTimeout(timeout);

    // Cleanup function to clear timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [currentFileContent, currentAliasName])

  const handleOpenFile = async () => {
    if (!window.electronAPI) return
    
    setIsLoading(true)
    try {
      const content = await window.electronAPI.openFile()
      if (content) {
        // Update the current active tab's content
        setTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.id === activeTabId 
              ? { ...tab, content: content }
              : tab
          )
        )
      }
    } catch (error) {
      console.error('Failed to open file:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveFile = async () => {
    if (!window.electronAPI || !currentFileContent) return
    
    setIsLoading(true)
    try {
      const success = await window.electronAPI.saveFile(currentFileContent)
      if (success) {
        alert('File saved successfully!')
      }
    } catch (error) {
      console.error('Failed to save file:', error)
      alert('Failed to save file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWindowControl = (action: 'minimize' | 'maximize' | 'close') => {
    if (!window.electronAPI) return
    
    switch (action) {
      case 'minimize':
        window.electronAPI.minimize()
        break
      case 'maximize':
        window.electronAPI.maximize()
        break
      case 'close':
        window.electronAPI.close()
        break
    }
  }

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId)
  }

  const handleTabContentChange = (content: string) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, content: content }
          : tab
      )
    )
  }

  const handleAliasNameChange = (aliasName: string) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { 
              ...tab, 
              aliasName: aliasName,
              name: aliasName.trim() || `Tab ${tabs.findIndex(t => t.id === activeTabId) + 1}`
            }
          : tab
      )
    )
  }

  const handleContextModeChange = (contextMode: boolean) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, contextMode: contextMode }
          : tab
      )
    )
  }

  const handleContextNameChange = (contextName: string) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, contextName: contextName }
          : tab
      )
    )
  }

  const handleContextUnitChange = (contextUnit: string) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, contextUnit: contextUnit }
          : tab
      )
    )
  }

  const handleCreateTab = () => {
    const newId = Date.now().toString()
    const newTab = {
      id: newId,
      name: `Tab ${tabs.length + 1}`,
      content: '',
      aliasName: '',
      contextMode: false,
      contextName: '',
      contextUnit: ''
    }
    setTabs(prevTabs => [...prevTabs, newTab])
    setActiveTabId(newId)
  }

  const handleDeleteTab = (tabId: string) => {
    const tabToDelete = tabs.find(tab => tab.id === tabId)
    if (!tabToDelete || tabToDelete.content.trim() !== '') {
      // Don't delete if tab has content
      return
    }
    
    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId)
      if (newTabs.length === 0) {
        // If no tabs left, create a new one
        const newTab = { 
          id: '1', 
          name: 'Tab 1', 
          content: '', 
          aliasName: '', 
          contextMode: false, 
          contextName: '', 
          contextUnit: '' 
        }
        setActiveTabId('1')
        return [newTab]
      }
      return newTabs
    })
    
    // If we deleted the active tab, switch to the first available tab
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId)
      if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[0].id)
      }
    }
  }

  const handleIdentifyWindow = async () => {
    try {
      if (window.electronAPI) {
        console.log('=== Searching for Starcraft II Window ===');
        
        // Use the findWindowByTitle function to search for "Starcraft II"
        const starcraftWindow = await window.electronAPI.findWindowByTitle('Starcraft II');
        
        if (starcraftWindow) {
          console.log('Found Starcraft II window:', starcraftWindow);
          console.log('Window Handle:', starcraftWindow.handle);
          console.log('Window Title:', starcraftWindow.title);
          
          // Save the handle to a variable and update state
          const starcraftHandle = starcraftWindow.handle;
          setStarcraftHandle(starcraftHandle.toString());
          console.log('Saved handle to variable starcraftHandle:', starcraftHandle);
        } else {
          console.log('Starcraft II window not found');
          
          // Fallback: enumerate all windows to see what's available
          console.log('\n=== Enumerating All Windows (for debugging) ===');
          const windows = await window.electronAPI.enumerateWindows();
          
          if (windows && windows.length > 0) {
            console.log(`Found ${windows.length} windows:`);
            windows.forEach((window, index) => {
              console.log(`${index + 1}. Title: "${window.title}" | Handle: ${window.handle}`);
            });
          }
          
          setStarcraftHandle('Not found');
        }
      }
    } catch (error) {
      console.error('Error finding Starcraft II window:', error);
    }
  }

  const handleSendEnter = async () => {
    try {
      if (window.electronAPI && starcraftHandle !== 'Not found') {
        const handle = parseInt(starcraftHandle);
        console.log('Sending Enter key to Starcraft II window...');
        const success = await window.electronAPI.sendEnter(handle);
        console.log('Send Enter result:', success);
      } else {
        console.log('No valid window handle available');
      }
    } catch (error) {
      console.error('Error sending Enter key:', error);
    }
  }

  const handleStartPeriodicEnter = () => {
    if (starcraftHandle === 'Not found') {
      console.log('No valid window handle available for periodic Enter/Escape');
      return;
    }

    setIsPeriodicEnterRunning(true);
    setShouldStop(false);
    
    const intervalMs = periodicEnterInterval * 1000;
    console.log(`Starting periodic Enter/Escape key sending every ${periodicEnterInterval} seconds`);
    
    let isEnterTurn = true; // Track whether to send Enter or Escape
    
    const intervalId = setInterval(async () => {
      if (shouldStop) {
        console.log('Periodic Enter/Escape stopped due to stop request');
        handleStopPeriodicEnter();
        return;
      }
      
      try {
        if (window.electronAPI && starcraftHandle !== 'Not found') {
          const handle = parseInt(starcraftHandle);
          
          if (isEnterTurn) {
            console.log('Sending periodic Enter key...');
            const success = await window.electronAPI.sendEnter(handle);
            console.log('Periodic Enter result:', success);
          } else {
            console.log('Sending periodic Escape key...');
            const success = await window.electronAPI.sendEscape(handle);
            console.log('Periodic Escape result:', success);
          }
          
          // Toggle for next iteration
          isEnterTurn = !isEnterTurn;
        }
      } catch (error) {
        console.error('Error sending periodic key:', error);
      }
    }, intervalMs);
    
    setPeriodicEnterIntervalId(intervalId);
  }

  const handleStopPeriodicEnter = () => {
    if (periodicEnterIntervalId) {
      clearInterval(periodicEnterIntervalId);
      setPeriodicEnterIntervalId(null);
    }
    setIsPeriodicEnterRunning(false);
    console.log('Periodic Enter key sending stopped');
  }

  const handleStopAll = () => {
    setShouldStop(true);
    handleStopPeriodicEnter();
    console.log('=== Stop Requested for All Operations ===');
  }

  // Function to parse code editor content into array of strings
  const parseCodeContent = (content: string): string[] => {
    const MAX_CHARS = 200;
    const result: string[] = [];
    
    // Replace all newline characters with semicolons before splitting
    const normalizedContent = content.replace(/\n/g, ';');
    
    // First, split by semicolons to get individual statements
    const statements = normalizedContent.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);
    
    let currentString = '';
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // If adding this statement would exceed the limit
      if (currentString.length + statement.length > MAX_CHARS) {
        // If we have content in currentString, save it
        if (currentString.length > 0) {
          result.push(currentString);
          currentString = '';
        }
        
        // If a single statement is longer than MAX_CHARS, we need to handle it specially
        if (statement.length > MAX_CHARS) {
          // For very long statements, we'll need to break them at word boundaries
          let remainingStatement = statement;
          while (remainingStatement.length > MAX_CHARS) {
            // Find the last space within the limit
            let breakPoint = MAX_CHARS;
            while (breakPoint > 0 && remainingStatement[breakPoint] !== ' ') {
              breakPoint--;
            }
            
            // If no space found, break at the limit
            if (breakPoint === 0) {
              breakPoint = MAX_CHARS;
            }
            
            result.push(remainingStatement.substring(0, breakPoint));
            remainingStatement = remainingStatement.substring(breakPoint).trim();
          }
          
          // Add the remaining part
          if (remainingStatement.length > 0) {
            currentString = remainingStatement;
          }
        } else {
          // Start a new string with this statement
          currentString = statement;
        }
      } else {
        // Add this statement to the current string
        if (currentString.length > 0) {
          currentString += '; ' + statement;
        } else {
          currentString = statement;
        }
      }
    }
    
    // Add any remaining content
    if (currentString.length > 0) {
      result.push(currentString);
    }
    
    return result;
  }

  // Function to add alias creation commands to parsed strings
  const addAliasCommands = (strings: string[], aliasName: string): string[] => {
    if (!aliasName.trim()) {
      return strings; // Return original strings if no alias name
    }
    
    return strings.map((str, index) => {
      const generatedName = `${aliasName.trim()}-${index}`;
      const aliasCommand = `alias create ${generatedName} `;
      let result = aliasCommand + str;
      
      // For all entries except the last one, append the next alias name
      if (index < strings.length - 1) {
        const nextGeneratedName = `${aliasName.trim()}-${index + 1}`;
        result += `;${nextGeneratedName}`;
      }
      
      return result;
    });
  }

  // Function to send text with Enter key buffering
  const sendTextWithEnterBuffer = async (text: string) => {
    try {
      if (window.electronAPI && starcraftHandle !== 'Not found') {
        const handle = parseInt(starcraftHandle);
        
        // Check for stop before starting
        if (shouldStop) {
          console.log('Send operation stopped before starting');
          return false;
        }
        
        // Step 1: Send Enter key
        console.log('Sending Enter key before text...');
        const enter1Success = await window.electronAPI.sendEnter(handle);
        console.log('Enter 1 result:', enter1Success);
        
        // Check for stop before delay
        if (shouldStop) {
          console.log('Send operation stopped after Enter 1');
          return false;
        }
        
        // Small delay to ensure the first Enter is processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check for stop before sending text
        if (shouldStop) {
          console.log('Send operation stopped before sending text');
          return false;
        }
        
        // Step 2: Send the text
        console.log('Sending text:', text);
        // const sendStringSuccess = await window.electronAPI.sendString(handle, text, 0);
        const sendStringSuccess = await window.electronAPI.postString(handle, text, 0);
        console.log('Send string result:', sendStringSuccess);
        
        // Check for stop before delay
        if (shouldStop) {
          console.log('Send operation stopped after sending text');
          return false;
        }
        
        // Small delay to ensure the text is fully entered
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check for stop before final Enter
        if (shouldStop) {
          console.log('Send operation stopped before Enter 2');
          return false;
        }
        
        // Step 3: Send Enter key after text
        console.log('Sending Enter key after text...');
        const enter2Success = await window.electronAPI.sendEnter(handle);
        console.log('Enter 2 result:', enter2Success);
        
        return sendStringSuccess;
      } else {
        console.log('No valid window handle available');
        return false;
      }
    } catch (error) {
      console.error('Error sending text with Enter buffer:', error);
      return false;
    }
  }



  const handleSendMessage = async () => {
    try {
      if (window.electronAPI && starcraftHandle !== 'Not found') {
        if (parsedStrings.length === 0) {
          console.log('No parsed strings to send');
          return;
        }

        setIsSendRunning(true);
        setShouldStop(false);
        console.log('=== Sending Parsed Strings to Starcraft II ===');
        
        // Determine which strings to send based on changes
        const stringsToSend: { index: number; string: string }[] = [];
        
        if (lastSentStrings.length === 0) {
          // First time sending - send all strings
          console.log('First time sending - sending all strings');
          parsedStrings.forEach((str, index) => {
            stringsToSend.push({ index, string: str });
          });
        } else {
          // Check for changes and only send modified strings
          console.log('Checking for changes in parsed strings...');
          parsedStrings.forEach((str, index) => {
            if (index >= lastSentStrings.length || str !== lastSentStrings[index]) {
              console.log(`String at index ${index} changed or is new - will send`);
              stringsToSend.push({ index, string: str });
            } else {
              console.log(`String at index ${index} unchanged - skipping`);
            }
          });
        }
        
        console.log(`Sending ${stringsToSend.length} changed/new strings out of ${parsedStrings.length} total`);
        
        // Step 1: Send context commands if context mode is enabled
        if (currentContextMode && currentContextName.trim() && currentContextUnit.trim() && !shouldStop) {
          const contextCommand = `@context ${currentContextName.trim()};@remove;@spawn ${currentContextUnit.trim()};@unitvar ${currentContextName.trim()}`;
          console.log('Step 1: Sending context command with Enter buffer...');
          const contextSuccess = await sendTextWithEnterBuffer(contextCommand);
          console.log('Context command result:', contextSuccess);
          
          // Check if we should stop after context command
          if (shouldStop) {
            console.log('Stopping after context command');
            return;
          }
          
          // Small delay after context command
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Step 2: Send each changed/new parsed string with Enter buffer
        for (let i = 0; i < stringsToSend.length && !shouldStop; i++) {
          const { index, string: parsedString } = stringsToSend[i];
          console.log(`Step ${2 + i}: Sending parsed string at index ${index}...`);
          console.log(`String: ${parsedString}`);
          const sendStringSuccess = await sendTextWithEnterBuffer(parsedString);
          console.log(`Send string at index ${index} result:`, sendStringSuccess);
          
          // Check if we should stop after this string
          if (shouldStop) {
            console.log(`Stopping after sending string at index ${index}`);
            return;
          }
          
          // Small delay between strings (except for the last one)
          if (i < stringsToSend.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Step 3: Send final context command if context mode is enabled and not stopped
        if (currentContextMode && currentContextName.trim() && currentAliasName.trim() && !shouldStop) {
          const firstAliasName = `${currentAliasName.trim()}-0`;
          const finalContextCommand = `@context ${currentContextName.trim()};${firstAliasName}`;
          console.log('Step 3: Sending final context command...');
          console.log(`Final command: ${finalContextCommand}`);
          const finalCommandSuccess = await sendTextWithEnterBuffer(finalContextCommand);
          console.log('Final context command result:', finalCommandSuccess);
        }
        
        // Only update last sent strings if the operation completed successfully
        if (!shouldStop) {
          setLastSentStrings([...parsedStrings]);
          console.log('=== Message Send Complete ===');
        } else {
          console.log('=== Message Send Interrupted ===');
        }
      } else {
        console.log('No valid window handle available');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSendRunning(false);
    }
  }

  const handleForceSendMessage = async () => {
    try {
      if (window.electronAPI && starcraftHandle !== 'Not found') {
        if (parsedStrings.length === 0) {
          console.log('No parsed strings to send');
          return;
        }

        setIsSendRunning(true);
        setShouldStop(false);
        console.log('=== Force Sending All Parsed Strings to Starcraft II ===');
        
        // Force send all strings without checking for changes
        const stringsToSend: { index: number; string: string }[] = [];
        console.log('Force sending all strings regardless of changes');
        parsedStrings.forEach((str, index) => {
          stringsToSend.push({ index, string: str });
        });
        
        console.log(`Force sending ${stringsToSend.length} strings out of ${parsedStrings.length} total`);
        
        // Step 1: Send context commands if context mode is enabled
        if (currentContextMode && currentContextName.trim() && currentContextUnit.trim() && !shouldStop) {
          const contextCommand = `@context ${currentContextName.trim()};@remove;@spawn ${currentContextUnit.trim()};@unitvar ${currentContextName.trim()}`;
          console.log('Step 1: Sending context command with Enter buffer...');
          const contextSuccess = await sendTextWithEnterBuffer(contextCommand);
          console.log('Context command result:', contextSuccess);
          
          // Check if we should stop after context command
          if (shouldStop) {
            console.log('Stopping after context command');
            return;
          }
          
          // Small delay after context command
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Step 2: Send each parsed string with Enter buffer
        for (let i = 0; i < stringsToSend.length && !shouldStop; i++) {
          const { index, string: parsedString } = stringsToSend[i];
          console.log(`Step ${2 + i}: Force sending parsed string at index ${index}...`);
          console.log(`String: ${parsedString}`);
          const sendStringSuccess = await sendTextWithEnterBuffer(parsedString);
          console.log(`Force send string at index ${index} result:`, sendStringSuccess);
          
          // Check if we should stop after this string
          if (shouldStop) {
            console.log(`Stopping after sending string at index ${index}`);
            return;
          }
          
          // Small delay between strings (except for the last one)
          if (i < stringsToSend.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Step 3: Send final context command if context mode is enabled and not stopped
        if (currentContextMode && currentContextName.trim() && currentAliasName.trim() && !shouldStop) {
          const firstAliasName = `${currentAliasName.trim()}-0`;
          const finalContextCommand = `@context ${currentContextName.trim()};${firstAliasName}`;
          console.log('Step 3: Sending final context command...');
          console.log(`Final command: ${finalContextCommand}`);
          const finalCommandSuccess = await sendTextWithEnterBuffer(finalContextCommand);
          console.log('Final context command result:', finalCommandSuccess);
        }
        
        // Update last sent strings if the operation completed successfully
        if (!shouldStop) {
          setLastSentStrings([...parsedStrings]);
          console.log('=== Force Message Send Complete ===');
        } else {
          console.log('=== Force Message Send Interrupted ===');
        }
      } else {
        console.log('No valid window handle available');
      }
    } catch (error) {
      console.error('Error force sending message:', error);
    } finally {
      setIsSendRunning(false);
    }
  }

  return (
    <div className="app">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="title-bar-content">
          <h1>Apex Modeling IDE</h1>
          <div className="window-controls">
            <button 
              className="window-control minimize"
              onClick={() => handleWindowControl('minimize')}
              title="Minimize"
            >
              ─
            </button>
            <button 
              className="window-control maximize"
              onClick={() => handleWindowControl('maximize')}
              title="Maximize"
            >
              □
            </button>
            <button 
              className="window-control close"
              onClick={() => handleWindowControl('close')}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar Controls */}
        <Controls
          currentContextMode={currentContextMode}
          currentContextName={currentContextName}
          currentContextUnit={currentContextUnit}
          onContextModeChange={handleContextModeChange}
          onContextNameChange={handleContextNameChange}
          onContextUnitChange={handleContextUnitChange}
          currentAliasName={currentAliasName}
          onAliasNameChange={handleAliasNameChange}
          starcraftHandle={starcraftHandle}
          parsedStrings={parsedStrings}
          isSendRunning={isSendRunning}
          isClearRunning={isClearRunning}
          maxClearIndex={maxClearIndex}
          onMaxClearIndexChange={setMaxClearIndex}
          onSendMessage={handleSendMessage}
          onForceSendMessage={handleForceSendMessage}
          onClearAlias={async () => {
            try {
              if (window.electronAPI && starcraftHandle !== 'Not found' && currentAliasName.trim()) {
                setIsClearRunning(true);
                setShouldStop(false);
                const handle = parseInt(starcraftHandle);
                for (let i = 0; i <= maxClearIndex && !shouldStop; i++) {
                  const generatedName = `${currentAliasName.trim()}-${i}`;
                  const removeCommand = `alias remove ${generatedName}`;
                  await sendTextWithEnterBuffer(removeCommand);
                  if (shouldStop) break;
                  if (i < maxClearIndex) await new Promise(resolve => setTimeout(resolve, 500));
                }
              }
            } catch (error) {
              console.error('Error clearing aliases:', error);
            } finally {
              setIsClearRunning(false);
            }
          }}
          onStopAll={handleStopAll}
          appVersion={appVersion}
        />
        {/* Code Editor Area */}
        <CodeEditor
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={handleTabChange}
          onTabContentChange={handleTabContentChange}
          onCreateTab={handleCreateTab}
          onDeleteTab={handleDeleteTab}
          parsedStrings={parsedStrings}
          debounceTimeout={debounceTimeout}
        />
        {/* Status Panel */}
        <StatusPanel
          currentFileContent={currentFileContent}
          parsedStrings={parsedStrings}
          starcraftHandle={starcraftHandle}
          onIdentifyWindow={handleIdentifyWindow}
          onSendEnter={handleSendEnter}
          onStartPeriodicEnter={handleStartPeriodicEnter}
          onStopPeriodicEnter={handleStopPeriodicEnter}
          periodicEnterInterval={periodicEnterInterval}
          onPeriodicEnterIntervalChange={setPeriodicEnterInterval}
          isPeriodicEnterRunning={isPeriodicEnterRunning}
          appVersion={appVersion}
        />
      </div>
    </div>
  )
}

export default App 