import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example API methods
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content: string) => ipcRenderer.invoke('dialog:saveFile', content),
  
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  
  // Win32 API methods
  getWindowInfo: () => ipcRenderer.invoke('win32:getWindowInfo'),
  enumerateWindows: () => ipcRenderer.invoke('win32:enumerateWindows'),
  findWindowByTitle: (title: string) => ipcRenderer.invoke('win32:findWindowByTitle', title),
  sendKeystrokes: (windowHandle: number, keystrokeType: number) => ipcRenderer.invoke('win32:sendKeystrokes', windowHandle, keystrokeType),
  sendText: (windowHandle: number, text: string) => ipcRenderer.invoke('win32:sendText', windowHandle, text),
  setClipboardText: (text: string) => ipcRenderer.invoke('win32:setClipboardText', text),
  sendPaste: (windowHandle: number) => ipcRenderer.invoke('win32:sendPaste', windowHandle),
  pasteText: (windowHandle: number) => ipcRenderer.invoke('win32:pasteText', windowHandle),
  sendChar: (windowHandle: number, character: string) => ipcRenderer.invoke('win32:sendChar', windowHandle, character),
  postChar: (windowHandle: number, character: string) => ipcRenderer.invoke('win32:postChar', windowHandle, character),
  sendKeyDown: (windowHandle: number, virtualKeyCode: number) => ipcRenderer.invoke('win32:sendKeyDown', windowHandle, virtualKeyCode),
  sendKeyUp: (windowHandle: number, virtualKeyCode: number) => ipcRenderer.invoke('win32:sendKeyUp', windowHandle, virtualKeyCode),
  sendString: (windowHandle: number, text: string, delay?: number) => ipcRenderer.invoke('win32:sendString', windowHandle, text, delay),
  postString: (windowHandle: number, text: string, delay?: number) => ipcRenderer.invoke('win32:postString', windowHandle, text, delay),
  sendEnter: (windowHandle: number) => ipcRenderer.invoke('win32:sendEnter', windowHandle),
  sendEscape: (windowHandle: number) => ipcRenderer.invoke('win32:sendEscape', windowHandle),
  
  // Listen for events from main process
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback)
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback)
  }
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>
      openFile: () => Promise<string | null>
      saveFile: (content: string) => Promise<boolean>
      minimize: () => void
      maximize: () => void
      close: () => void
      getWindowInfo: () => Promise<any>
      enumerateWindows: () => Promise<any[]>
      findWindowByTitle: (title: string) => Promise<any>
      sendKeystrokes: (windowHandle: number, keystrokeType: number) => Promise<boolean>
      sendText: (windowHandle: number, text: string) => Promise<boolean>
      setClipboardText: (text: string) => Promise<boolean>
      sendPaste: (windowHandle: number) => Promise<boolean>
      pasteText: (windowHandle: number) => Promise<boolean>
      sendChar: (windowHandle: number, character: string) => Promise<boolean>
      postChar: (windowHandle: number, character: string) => Promise<boolean>
      sendKeyDown: (windowHandle: number, virtualKeyCode: number) => Promise<boolean>
      sendKeyUp: (windowHandle: number, virtualKeyCode: number) => Promise<boolean>
      sendString: (windowHandle: number, text: string, delay?: number) => Promise<boolean>
      postString: (windowHandle: number, text: string, delay?: number) => Promise<boolean>
      sendEnter: (windowHandle: number) => Promise<boolean>
      sendEscape: (windowHandle: number) => Promise<boolean>
      onUpdateAvailable: (callback: () => void) => void
      onUpdateDownloaded: (callback: () => void) => void
    }
  }
} 