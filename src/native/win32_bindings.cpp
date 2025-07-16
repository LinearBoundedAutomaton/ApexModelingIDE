#include <node.h>
#include <v8.h>
#include <windows.h>
#include <string>
#include <vector>

namespace win32_bindings {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;
using v8::Number;
using v8::Boolean;
using v8::Array;
using v8::Context;

// Sample function to get window information
void GetWindowInfo(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  // Get the current foreground window
  HWND hwnd = GetForegroundWindow();

  if (hwnd != NULL) {
    // Get window title
    char windowTitle[256];
    GetWindowTextA(hwnd, windowTitle, sizeof(windowTitle));

    // Get window dimensions
    RECT rect;
    GetWindowRect(hwnd, &rect);

    // Create result object
    Local<Object> result = Object::New(isolate);

    // Add properties to result
    result->Set(context, String::NewFromUtf8(isolate, "title").ToLocalChecked(),
                String::NewFromUtf8(isolate, windowTitle).ToLocalChecked()).Check();
    result->Set(context, String::NewFromUtf8(isolate, "width").ToLocalChecked(),
                Number::New(isolate, rect.right - rect.left)).Check();
    result->Set(context, String::NewFromUtf8(isolate, "height").ToLocalChecked(),
                Number::New(isolate, rect.bottom - rect.top)).Check();
    result->Set(context, String::NewFromUtf8(isolate, "x").ToLocalChecked(),
                Number::New(isolate, rect.left)).Check();
    result->Set(context, String::NewFromUtf8(isolate, "y").ToLocalChecked(),
                Number::New(isolate, rect.top)).Check();

    args.GetReturnValue().Set(result);
  } else {
    args.GetReturnValue().Set(v8::Null(isolate));
  }
}

struct EnumWindowsData {
  Isolate* isolate;
  Local<Context> context;
  Local<Array> windows;
  int index;
};

BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam) {
  EnumWindowsData* data = reinterpret_cast<EnumWindowsData*>(lParam);
  Isolate* isolate = data->isolate;
  Local<Context> context = data->context;
  Local<Array> windows = data->windows;

  // Only include visible windows with titles
  if (IsWindowVisible(hwnd)) {
    char windowTitle[256];
    GetWindowTextA(hwnd, windowTitle, sizeof(windowTitle));

    if (strlen(windowTitle) > 0) {
      // Create window info object
      Local<Object> windowInfo = Object::New(isolate);
      windowInfo->Set(context, String::NewFromUtf8(isolate, "title").ToLocalChecked(),
                     String::NewFromUtf8(isolate, windowTitle).ToLocalChecked()).Check();
      windowInfo->Set(context, String::NewFromUtf8(isolate, "handle").ToLocalChecked(),
                     Number::New(isolate, reinterpret_cast<intptr_t>(hwnd))).Check();

      // Add to array
      windows->Set(context, data->index++, windowInfo).Check();
    }
  }

  return TRUE; // Continue enumeration
}

// Sample function to enumerate all windows
void EnumerateWindows(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  // Create array to hold window information
  Local<Array> windows = Array::New(isolate);

  EnumWindowsData data = { isolate, context, windows, 0 };
  EnumWindows(EnumWindowsProc, reinterpret_cast<LPARAM>(&data));

  args.GetReturnValue().Set(windows);
}

// Helper function to convert v8 string to std::wstring
std::wstring v8StringToWString(Isolate* isolate, Local<String> v8String) {
  String::Utf8Value utf8String(isolate, v8String);
  std::string str(*utf8String);
  
  // Use Windows API instead of deprecated codecvt
  int wideLength = MultiByteToWideChar(CP_UTF8, 0, str.c_str(), -1, nullptr, 0);
  if (wideLength == 0) {
    return L"";
  }
  
  std::wstring wideString(wideLength - 1, L'\0');
  MultiByteToWideChar(CP_UTF8, 0, str.c_str(), -1, &wideString[0], wideLength);
  return wideString;
}

// Function to send keystrokes to a window
void SendKeystrokes(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  // Check arguments
  if (args.Length() < 2) {
    isolate->ThrowException(v8::Exception::TypeError(
      String::NewFromUtf8(isolate, "SendKeystrokes requires window handle and keystroke type").ToLocalChecked()));
    return;
  }

  // Get window handle
  HWND hwnd = reinterpret_cast<HWND>(static_cast<intptr_t>(args[0]->NumberValue(context).ToChecked()));
  
  // Get keystroke type (0 = Enter, 1 = Ctrl+V, etc.)
  int keystrokeType = args[1]->Int32Value(context).ToChecked();

  // Send keystrokes based on type
  switch (keystrokeType) {
    case 0: // Enter key
      SendMessage(hwnd, WM_KEYDOWN, VK_RETURN, 0);
      SendMessage(hwnd, WM_KEYUP, VK_RETURN, 0);
      break;
    case 1: // Ctrl+V (Paste)
      SendMessage(hwnd, WM_KEYDOWN, VK_CONTROL, 0);
      SendMessage(hwnd, WM_KEYDOWN, 'V', 0);
      SendMessage(hwnd, WM_KEYUP, 'V', 0);
      SendMessage(hwnd, WM_KEYUP, VK_CONTROL, 0);
      break;
    default:
      isolate->ThrowException(v8::Exception::TypeError(
        String::NewFromUtf8(isolate, "Unknown keystroke type").ToLocalChecked()));
      return;
  }

  args.GetReturnValue().Set(Boolean::New(isolate, true));
}

// Function to send text to a window using WM_SETTEXT
void SendText(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  // Check arguments
  if (args.Length() < 2) {
    isolate->ThrowException(v8::Exception::TypeError(
      String::NewFromUtf8(isolate, "SendText requires window handle and text").ToLocalChecked()));
    return;
  }

  // Get window handle
  HWND hwnd = reinterpret_cast<HWND>(static_cast<intptr_t>(args[0]->NumberValue(context).ToChecked()));
  
  // Get text to send
  std::wstring text = v8StringToWString(isolate, args[1].As<String>());

  // Send text using WM_SETTEXT
  LRESULT result = SendMessage(hwnd, WM_SETTEXT, 0, reinterpret_cast<LPARAM>(text.c_str()));

  args.GetReturnValue().Set(Boolean::New(isolate, result != 0));
}

// Function to set clipboard text
void SetClipboardText(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  // Check arguments
  if (args.Length() < 1) {
    isolate->ThrowException(v8::Exception::TypeError(
      String::NewFromUtf8(isolate, "SetClipboardText requires text").ToLocalChecked()));
    return;
  }

  // Get text to set
  std::wstring text = v8StringToWString(isolate, args[0].As<String>());

  // Open clipboard
  if (!OpenClipboard(NULL)) {
    isolate->ThrowException(v8::Exception::Error(
      String::NewFromUtf8(isolate, "Failed to open clipboard").ToLocalChecked()));
    return;
  }

  // Clear clipboard
  EmptyClipboard();

  // Allocate global memory for the text
  HGLOBAL hGlobal = GlobalAlloc(GMEM_MOVEABLE, (text.length() + 1) * sizeof(wchar_t));
  if (hGlobal == NULL) {
    CloseClipboard();
    isolate->ThrowException(v8::Exception::Error(
      String::NewFromUtf8(isolate, "Failed to allocate memory for clipboard").ToLocalChecked()));
    return;
  }

  // Copy text to global memory
  wchar_t* pGlobal = static_cast<wchar_t*>(GlobalLock(hGlobal));
  wcscpy_s(pGlobal, text.length() + 1, text.c_str());
  GlobalUnlock(hGlobal);

  // Set clipboard data
  if (SetClipboardData(CF_UNICODETEXT, hGlobal) == NULL) {
    GlobalFree(hGlobal);
    CloseClipboard();
    isolate->ThrowException(v8::Exception::Error(
      String::NewFromUtf8(isolate, "Failed to set clipboard data").ToLocalChecked()));
    return;
  }

  CloseClipboard();

  args.GetReturnValue().Set(Boolean::New(isolate, true));
}

// Function to send Ctrl+V to a window
void SendPaste(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  // Check arguments
  if (args.Length() < 1) {
    isolate->ThrowException(v8::Exception::TypeError(
      String::NewFromUtf8(isolate, "SendPaste requires window handle").ToLocalChecked()));
    return;
  }

  // Get window handle
  HWND hwnd = reinterpret_cast<HWND>(static_cast<intptr_t>(args[0]->NumberValue(context).ToChecked()));

  // Send Ctrl+V to paste
  SendMessage(hwnd, WM_KEYDOWN, VK_CONTROL, 0);
  SendMessage(hwnd, WM_KEYDOWN, 'V', 0);
  SendMessage(hwnd, WM_KEYUP, 'V', 0);
  SendMessage(hwnd, WM_KEYUP, VK_CONTROL, 0);

  args.GetReturnValue().Set(Boolean::New(isolate, true));
}

// Function to paste text directly using WM_PASTE
void PasteText(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  // Check arguments
  if (args.Length() < 1) {
    isolate->ThrowException(v8::Exception::TypeError(
      String::NewFromUtf8(isolate, "PasteText requires window handle").ToLocalChecked()));
    return;
  }

  // Get window handle
  HWND hwnd = reinterpret_cast<HWND>(static_cast<intptr_t>(args[0]->NumberValue(context).ToChecked()));

  // Send WM_PASTE message to paste clipboard content
  LRESULT result = SendMessage(hwnd, WM_PASTE, 0, 0);

  args.GetReturnValue().Set(Boolean::New(isolate, result != 0));
}

// Function to send a single character using WM_CHAR
void SendChar(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  // Check arguments
  if (args.Length() < 2) {
    isolate->ThrowException(v8::Exception::TypeError(
      String::NewFromUtf8(isolate, "SendChar requires window handle and character").ToLocalChecked()));
    return;
  }

  // Get window handle
  HWND hwnd = reinterpret_cast<HWND>(static_cast<intptr_t>(args[0]->NumberValue(context).ToChecked()));
  
  // Get character to send
  std::wstring charStr = v8StringToWString(isolate, args[1].As<String>());
  
  if (charStr.empty()) {
    isolate->ThrowException(v8::Exception::TypeError(
      String::NewFromUtf8(isolate, "Character cannot be empty").ToLocalChecked()));
    return;
  }

  // Get the first character (in case a string was passed)
  wchar_t character = charStr[0];

  // Send WM_CHAR message
  LRESULT result = SendMessage(hwnd, WM_CHAR, static_cast<WPARAM>(character), 0);

  // Return 0 for success, 1 for failure
  int errorCode = (result != 0) ? 0 : 1;
  args.GetReturnValue().Set(Number::New(isolate, errorCode));
}

// Function to post a single character using WM_CHAR
void PostChar(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  // Check arguments
  if (args.Length() < 2) {
    isolate->ThrowException(v8::Exception::TypeError(
      String::NewFromUtf8(isolate, "PostChar requires window handle and character").ToLocalChecked()));
    return;
  }

  // Get window handle
  HWND hwnd = reinterpret_cast<HWND>(static_cast<intptr_t>(args[0]->NumberValue(context).ToChecked()));
  
  // Get character to send
  std::wstring charStr = v8StringToWString(isolate, args[1].As<String>());
  
  if (charStr.empty()) {
    isolate->ThrowException(v8::Exception::TypeError(
      String::NewFromUtf8(isolate, "Character cannot be empty").ToLocalChecked()));
    return;
  }

  // Get the first character (in case a string was passed)
  wchar_t character = charStr[0];

  // Post WM_CHAR message
  BOOL result = PostMessage(hwnd, WM_CHAR, static_cast<WPARAM>(character), 0);

  // Return 0 for success, 1 for failure
  int errorCode = (result != 0) ? 0 : 1;
  args.GetReturnValue().Set(Number::New(isolate, errorCode));
}

// Function to send WM_KEYDOWN message
void SendKeyDown(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  // Check arguments
  if (args.Length() < 2) {
    isolate->ThrowException(v8::Exception::TypeError(
      String::NewFromUtf8(isolate, "SendKeyDown requires window handle and virtual key code").ToLocalChecked()));
    return;
  }

  // Get window handle
  HWND hwnd = reinterpret_cast<HWND>(static_cast<intptr_t>(args[0]->NumberValue(context).ToChecked()));
  
  // Get virtual key code
  int virtualKeyCode = args[1]->Int32Value(context).ToChecked();

  // Send WM_KEYDOWN message
  LRESULT result = SendMessage(hwnd, WM_KEYDOWN, static_cast<WPARAM>(virtualKeyCode), 0);

  // Return 0 for success, 1 for failure
  int errorCode = (result != 0) ? 0 : 1;
  args.GetReturnValue().Set(Number::New(isolate, errorCode));
}

// Function to send WM_KEYUP message
void SendKeyUp(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  // Check arguments
  if (args.Length() < 2) {
    isolate->ThrowException(v8::Exception::TypeError(
      String::NewFromUtf8(isolate, "SendKeyUp requires window handle and virtual key code").ToLocalChecked()));
    return;
  }

  // Get window handle
  HWND hwnd = reinterpret_cast<HWND>(static_cast<intptr_t>(args[0]->NumberValue(context).ToChecked()));
  
  // Get virtual key code
  int virtualKeyCode = args[1]->Int32Value(context).ToChecked();

  // Send WM_KEYUP message
  LRESULT result = SendMessage(hwnd, WM_KEYUP, static_cast<WPARAM>(virtualKeyCode), 0);

  // Return 0 for success, 1 for failure
  int errorCode = (result != 0) ? 0 : 1;
  args.GetReturnValue().Set(Number::New(isolate, errorCode));
}

// Initialize the module
void Initialize(Local<Object> exports) {
  NODE_SET_METHOD(exports, "getWindowInfo", GetWindowInfo);
  NODE_SET_METHOD(exports, "enumerateWindows", EnumerateWindows);
  NODE_SET_METHOD(exports, "sendKeystrokes", SendKeystrokes);
  NODE_SET_METHOD(exports, "sendText", SendText);
  NODE_SET_METHOD(exports, "setClipboardText", SetClipboardText);
  NODE_SET_METHOD(exports, "sendPaste", SendPaste);
  NODE_SET_METHOD(exports, "pasteText", PasteText);
  NODE_SET_METHOD(exports, "sendChar", SendChar);
  NODE_SET_METHOD(exports, "postChar", PostChar);
  NODE_SET_METHOD(exports, "sendKeyDown", SendKeyDown);
  NODE_SET_METHOD(exports, "sendKeyUp", SendKeyUp);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)

} // namespace win32_bindings 