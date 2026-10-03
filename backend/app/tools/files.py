"""
Filesystem Tools for Project SOL AI Subsystem.
Implements search, read, write, move, and delete tools with path validation.
"""
import glob
import os
import shutil
from typing import Any, Dict, List


def search_files_tool(directory: str, pattern: str = "*") -> Dict[str, Any]:
    """Search files in a directory using glob pattern."""
    if not os.path.exists(directory):
        return {"success": False, "verified": False, "error": f"Directory '{directory}' does not exist."}

    search_path = os.path.join(directory, pattern)
    files = glob.glob(search_path, recursive=False)
    results = [
        {"path": f, "name": os.path.basename(f), "size": os.path.getsize(f) if os.path.isfile(f) else 0}
        for f in files[:30]
    ]
    return {"success": True, "verified": True, "count": len(results), "files": results}


def read_file_tool(file_path: str, max_bytes: int = 10000) -> Dict[str, Any]:
    """Read textual content from a local file safely."""
    if not os.path.exists(file_path):
        return {"success": False, "verified": False, "error": f"File '{file_path}' does not exist."}

    if not os.path.isfile(file_path):
        return {"success": False, "verified": False, "error": f"Path '{file_path}' is a directory, not a file."}

    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read(max_bytes)
        return {
            "success": True,
            "verified": True,
            "path": file_path,
            "bytes_read": len(content),
            "content": content,
        }
    except Exception as e:
        return {"success": False, "verified": False, "error": f"Error reading file: {str(e)}"}


def write_file_tool(file_path: str, content: str) -> Dict[str, Any]:
    """Write text content to a local file."""
    try:
        os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return {"success": True, "verified": os.path.exists(file_path), "path": file_path, "bytes_written": len(content)}
    except Exception as e:
        return {"success": False, "verified": False, "error": f"Error writing file: {str(e)}"}


def move_file_tool(source: str, destination: str) -> Dict[str, Any]:
    """Move or rename a file safely."""
    if not os.path.exists(source):
        return {"success": False, "verified": False, "error": f"Source path '{source}' does not exist."}
    try:
        shutil.move(source, destination)
        return {"success": True, "verified": os.path.exists(destination), "source": source, "destination": destination}
    except Exception as e:
        return {"success": False, "verified": False, "error": f"Error moving file: {str(e)}"}


def delete_file_tool(file_path: str) -> Dict[str, Any]:
    """Delete a file safely."""
    if not os.path.exists(file_path):
        return {"success": False, "verified": False, "error": f"File '{file_path}' does not exist."}
    try:
        os.remove(file_path)
        return {"success": True, "verified": not os.path.exists(file_path), "path": file_path}
    except Exception as e:
        return {"success": False, "verified": False, "error": f"Error deleting file: {str(e)}"}
