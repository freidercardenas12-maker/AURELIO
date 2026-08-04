Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c node src/index.js", 0, False
