import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

// Import Win32 API bindings
let Win32API: any = null;
try {
  // __dirname points to dist/ when compiled, so we need to go up to project root
  const projectRoot = path.join(__dirname, '..');
  Win32API = require(path.join(projectRoot, 'native/win32_bindings.js'));
} catch (error) {
  console.warn('Win32 API bindings not available:', (error as Error).message);
}

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // Don't show until ready
    titleBarStyle: 'hidden', // Hide default title bar
    frame: false // Remove default window frame
  })

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:3001')
    // Open DevTools in development
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'apex', 'js', 'ts', 'json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const filePath = result.filePaths[0]
      const content = fs.readFileSync(filePath, 'utf8')
      return content
    } catch (error) {
      console.error('Error reading file:', error)
      return null
    }
  }
  
  return null
})

ipcMain.handle('dialog:saveFile', async (event, content: string) => {
  if (!mainWindow) return false
  
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Text Files', extensions: ['txt', 'apex', 'js', 'ts', 'json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, content, 'utf8')
      return true
    } catch (error) {
      console.error('Error writing file:', error)
      return false
    }
  }
  
  return false
})

// Window control handlers
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window:close', () => {
  mainWindow?.close()
})

// Win32 API handlers
ipcMain.handle('win32:getWindowInfo', async () => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.getWindowInfo();
})

ipcMain.handle('win32:enumerateWindows', async () => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.enumerateWindows();
})

ipcMain.handle('win32:findWindowByTitle', async (event, title: string) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.findWindowByTitle(title);
})

ipcMain.handle('win32:sendKeystrokes', async (event, windowHandle: number, keystrokeType: number) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.sendKeystrokes(windowHandle, keystrokeType);
})

ipcMain.handle('win32:sendText', async (event, windowHandle: number, text: string) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.sendText(windowHandle, text);
})

ipcMain.handle('win32:setClipboardText', async (event, text: string) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.setClipboardText(text);
})

ipcMain.handle('win32:sendEnter', async (event, windowHandle: number) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.sendEnter(windowHandle);
})

ipcMain.handle('win32:sendEscape', async (event, windowHandle: number) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.sendEscape(windowHandle);
})

ipcMain.handle('win32:sendPaste', async (event, windowHandle: number) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.sendPaste(windowHandle);
})

ipcMain.handle('win32:pasteText', async (event, windowHandle: number) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.pasteText(windowHandle);
})

ipcMain.handle('win32:sendChar', async (event, windowHandle: number, character: string) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.sendChar(windowHandle, character);
})

ipcMain.handle('win32:postChar', async (event, windowHandle: number, character: string) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.postChar(windowHandle, character);
})

ipcMain.handle('win32:sendString', async (event, windowHandle: number, text: string, delay?: number) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.sendString(windowHandle, text, delay);
})

ipcMain.handle('win32:postString', async (event, windowHandle: number, text: string, delay?: number) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.postString(windowHandle, text, delay);
})

ipcMain.handle('win32:sendKeyDown', async (event, windowHandle: number, virtualKeyCode: number) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.sendKeyDown(windowHandle, virtualKeyCode);
})

ipcMain.handle('win32:sendKeyUp', async (event, windowHandle: number, virtualKeyCode: number) => {
  if (!Win32API) {
    throw new Error('Win32 API bindings not available');
  }
  return Win32API.sendKeyUp(windowHandle, virtualKeyCode);
})

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow()

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })
}) 