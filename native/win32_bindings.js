const path = require('path');
const win32_bindings = require(path.join(__dirname, '../build/Release/win32_bindings.node'));

class Win32API {
  /**
   * Get information about the current foreground window
   * @returns {Object|null} Window information or null if no window found
   */
  static getWindowInfo() {
    try {
      return win32_bindings.getWindowInfo();
    } catch (error) {
      console.error('Error getting window info:', error);
      return null;
    }
  }

  /**
   * Enumerate all visible windows with titles
   * @returns {Array} Array of window objects with title and handle
   */
  static enumerateWindows() {
    try {
      return win32_bindings.enumerateWindows();
    } catch (error) {
      console.error('Error enumerating windows:', error);
      return [];
    }
  }

  /**
   * Find a window by title (case-insensitive partial match)
   * @param {string} title - Title to search for
   * @returns {Object|null} Window object or null if not found
   */
  static findWindowByTitle(title) {
    try {
      const windows = this.enumerateWindows();
      const searchTitle = title.toLowerCase();
      
      return windows.find(window => 
        window.title.toLowerCase().includes(searchTitle)
      ) || null;
    } catch (error) {
      console.error('Error finding window by title:', error);
      return null;
    }
  }

  /**
   * Get all windows that match a title pattern
   * @param {string} title - Title pattern to search for
   * @returns {Array} Array of matching window objects
   */
  static findWindowsByTitle(title) {
    try {
      const windows = this.enumerateWindows();
      const searchTitle = title.toLowerCase();
      
      return windows.filter(window => 
        window.title.toLowerCase().includes(searchTitle)
      );
    } catch (error) {
      console.error('Error finding windows by title:', error);
      return [];
    }
  }

  /**
   * Send keystrokes to a window
   * @param {number} windowHandle - Window handle
   * @param {number} keystrokeType - 0 = Enter, 1 = Ctrl+V
   * @returns {boolean} Success status
   */
  static sendKeystrokes(windowHandle, keystrokeType) {
    try {
      return win32_bindings.sendKeystrokes(windowHandle, keystrokeType);
    } catch (error) {
      console.error('Error sending keystrokes:', error);
      return false;
    }
  }

  /**
   * Send text to a window using WM_SETTEXT
   * @param {number} windowHandle - Window handle
   * @param {string} text - Text to send
   * @returns {boolean} Success status
   */
  static sendText(windowHandle, text) {
    try {
      return win32_bindings.sendText(windowHandle, text);
    } catch (error) {
      console.error('Error sending text:', error);
      return false;
    }
  }

  /**
   * Set text in the clipboard
   * @param {string} text - Text to set in clipboard
   * @returns {boolean} Success status
   */
  static setClipboardText(text) {
    try {
      return win32_bindings.setClipboardText(text);
    } catch (error) {
      console.error('Error setting clipboard text:', error);
      return false;
    }
  }

  /**
   * Send Ctrl+V to a window to paste clipboard content
   * @param {number} windowHandle - Window handle
   * @returns {boolean} Success status
   */
  static sendPaste(windowHandle) {
    try {
      return win32_bindings.sendPaste(windowHandle);
    } catch (error) {
      console.error('Error sending paste command:', error);
      return false;
    }
  }

  /**
   * Paste text directly using WM_PASTE message
   * @param {number} windowHandle - Window handle
   * @returns {boolean} Success status
   */
  static pasteText(windowHandle) {
    try {
      return win32_bindings.pasteText(windowHandle);
    } catch (error) {
      console.error('Error pasting text:', error);
      return false;
    }
  }

  /**
   * Send a single character using WM_CHAR message
   * @param {number} windowHandle - Window handle
   * @param {string} character - Character to send
   * @returns {boolean} Success status
   */
  static sendChar(windowHandle, character) {
    try {
      const result = win32_bindings.sendChar(windowHandle, character);
      // Return true if error code is 0 (success), false otherwise
      return result === 0;
    } catch (error) {
      console.error('Error sending character:', error);
      return false;
    }
  }

  /**
   * Post a single character using WM_CHAR message (asynchronous)
   * @param {number} windowHandle - Window handle
   * @param {string} character - Character to post
   * @returns {boolean} Success status
   */
  static postChar(windowHandle, character) {
    try {
      const result = win32_bindings.postChar(windowHandle, character);
      // Return true if error code is 0 (success), false otherwise
      return result === 0;
    } catch (error) {
      console.error('Error posting character:', error);
      return false;
    }
  }

  /**
   * Send WM_KEYDOWN message
   * @param {number} windowHandle - Window handle
   * @param {number} virtualKeyCode - Virtual key code
   * @returns {boolean} Success status
   */
  static sendKeyDown(windowHandle, virtualKeyCode) {
    try {
      const result = win32_bindings.sendKeyDown(windowHandle, virtualKeyCode);
      // Return true if error code is 0 (success), false otherwise
      return result === 0;
    } catch (error) {
      console.error('Error sending key down:', error);
      return false;
    }
  }

  /**
   * Send WM_KEYUP message
   * @param {number} windowHandle - Window handle
   * @param {number} virtualKeyCode - Virtual key code
   * @returns {boolean} Success status
   */
  static sendKeyUp(windowHandle, virtualKeyCode) {
    try {
      const result = win32_bindings.sendKeyUp(windowHandle, virtualKeyCode);
      // Return true if error code is 0 (success), false otherwise
      return result === 0;
    } catch (error) {
      console.error('Error sending key up:', error);
      return false;
    }
  }

  /**
   * Convert character to virtual key code
   * @param {string} character - Character to convert
   * @returns {number} Virtual key code
   */
  static charToVirtualKeyCode(character) {
    const charCode = character.charCodeAt(0);
    
    // Handle common cases
    if (charCode >= 65 && charCode <= 90) { // A-Z
      return charCode; // VK_A = 65, VK_B = 66, etc.
    } else if (charCode >= 97 && charCode <= 122) { // a-z
      return charCode - 32; // Convert to uppercase
    } else if (charCode >= 48 && charCode <= 57) { // 0-9
      return charCode; // VK_0 = 48, VK_1 = 49, etc.
    } else {
      // For other characters, return the char code
      // This is a simplified approach - in a real implementation,
      // you might want a more comprehensive mapping
      return charCode;
    }
  }

  /**
   * Send a string character by character using WM_CHAR with keydown/keyup events
   * @param {number} windowHandle - Window handle
   * @param {string} text - Text to send
   * @param {number} delay - Delay between characters in milliseconds (default: 10)
   * @returns {Promise<boolean>} Success status
   */
  static async sendString(windowHandle, text, delay = 10) {
    try {
      let successCount = 0;
      let failureCount = 0;
      
      for (let i = 0; i < text.length; i++) {
        const character = text[i];
        const virtualKeyCode = this.charToVirtualKeyCode(character);
        
        // Send keydown
        // const keyDownSuccess = this.sendKeyDown(windowHandle, virtualKeyCode);
        // if (!keyDownSuccess) {
        //   console.warn(`Failed to send keydown for character at index ${i}: ${character}`);
        //   failureCount++;
        // }
        
        // Send character
        const charSuccess = this.sendChar(windowHandle, character);
        if (!charSuccess) {
          console.warn(`Failed to send character at index ${i}: ${character}`);
          failureCount++;
        } else {
          successCount++;
        }
        
        // Send keyup
        // const keyUpSuccess = this.sendKeyUp(windowHandle, virtualKeyCode);
        // if (!keyUpSuccess) {
        //   console.warn(`Failed to send keyup for character at index ${i}: ${character}`);
        //   failureCount++;
        // }
        
        // Add delay between characters if specified
        if (delay > 0 && i < text.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      console.log(`String send complete: ${successCount} characters sent successfully, ${failureCount} failures`);
      
      // Return true if at least some characters were sent successfully
      return successCount > 0;
    } catch (error) {
      console.error('Error sending string:', error);
      return false;
    }
  }

  /**
   * Post a string character by character using WM_CHAR (asynchronous)
   * @param {number} windowHandle - Window handle
   * @param {string} text - Text to post
   * @param {number} delay - Delay between characters in milliseconds (default: 10)
   * @returns {Promise<boolean>} Success status
   */
  static async postString(windowHandle, text, delay = 10) {
    try {
      let successCount = 0;
      let failureCount = 0;
      
      for (let i = 0; i < text.length; i++) {
        const character = text[i];
        
        // Post character
        const charSuccess = this.postChar(windowHandle, character);
        if (!charSuccess) {
          console.warn(`Failed to post character at index ${i}: ${character}`);
          failureCount++;
        } else {
          successCount++;
        }
        
        // Add delay between characters if specified
        if (delay > 0 && i < text.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      console.log(`String post complete: ${successCount} characters posted successfully, ${failureCount} failures`);
      
      // Return true if at least some characters were posted successfully
      return successCount > 0;
    } catch (error) {
      console.error('Error posting string:', error);
      return false;
    }
  }

  /**
   * Send Enter key to a window
   * @param {number} windowHandle - Window handle
   * @returns {boolean} Success status
   */
  static sendEnter(windowHandle) {
    return this.sendKeystrokes(windowHandle, 0);
  }

  /**
   * Send Escape key to a window using virtual key code 27 (VK_ESCAPE)
   * @param {number} windowHandle - Window handle
   * @returns {boolean} Success status
   */
  static sendEscape(windowHandle) {
    try {
      // VK_ESCAPE = 27
      const keyDownSuccess = this.sendKeyDown(windowHandle, 27);
      const keyUpSuccess = this.sendKeyUp(windowHandle, 27);
      return keyDownSuccess && keyUpSuccess;
    } catch (error) {
      console.error('Error sending Escape key:', error);
      return false;
    }
  }
}

module.exports = Win32API; 