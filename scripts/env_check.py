#!/usr/bin/env python3
"""Probe what's available on this machine and write ui/env-status.json.

Zero third-party dependencies on purpose -- this has to run on a bare VM
before anything else in the workshop has been installed.
"""
import json
import platform
import shutil
import socket
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "ui" / "env-status.json"


def run_version(cmd):
    path = shutil.which(cmd[0])
    if not path:
        return {"available": False, "version": None, "path": None}
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        text = (result.stdout or result.stderr or "").strip()
        version = text.splitlines()[0] if text else "unknown version"
    except Exception:
        version = "unknown version"
    return {"available": True, "version": version, "path": path}


def check_internet():
    try:
        socket.setdefaulttimeout(2)
        socket.create_connection(("1.1.1.1", 443))
        return {"available": True}
    except Exception:
        return {"available": False}


def main():
    checks = {
        "python3": run_version(["python3", "--version"]) if shutil.which("python3") else run_version(["python", "--version"]),
        "node": run_version(["node", "--version"]),
        "npm": run_version(["npm", "--version"]),
        "docker": run_version(["docker", "--version"]),
        "docker_compose": run_version(["docker", "compose", "version"]),
        "git": run_version(["git", "--version"]),
        "internet": check_internet(),
    }
    payload = {
        "platform": platform.platform(),
        "python_executable": sys.executable,
        "checks": checks,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2))
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
