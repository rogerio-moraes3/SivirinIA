#!/usr/bin/env python3
"""Native ARM/AMD64 Docker acceptance on a VM without Node installed on the host.
No credentials, ports or external network are used. Uses synthetic repository fixtures.
"""
import base64
import json
import platform
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMAGE = "sivirinia-worker:staging"

def container(arguments, payload=None, timeout=90):
    result = subprocess.run(
        ["docker", "run", "--rm", "-i", "--network=none", "--read-only",
         "--cap-drop=ALL", "--security-opt=no-new-privileges:true", "--memory=2g",
         "--pids-limit=128", "--tmpfs=/tmp:size=256m,mode=1777",
         "--entrypoint=node", IMAGE, *arguments],
        input=payload, text=True, capture_output=True, timeout=timeout, check=True,
    )
    return result.stdout

host = {"aarch64": "arm64", "arm64": "arm64", "x86_64": "x64", "AMD64": "x64"}.get(platform.machine())
if host is None:
    raise SystemExit("Host requires native ARM64 or AMD64.")
architecture = container(["-p", "process.arch"]).strip()
if architecture != host:
    raise SystemExit("Image architecture differs from host; this does not validate native execution.")
print(f"Native architecture verified: {architecture}", flush=True)
program = """import { extractInChild } from './lib/document-pipeline.ts';
if (process.getuid() === 0) throw new Error('root forbidden');
let input = ''; for await (const part of process.stdin) input += part;
console.log(JSON.stringify(await extractInChild(JSON.parse(input))));"""
for name in ("policy.pdf", "scanned-ptbr.pdf"):
    payload = json.dumps({"id": "vm-acceptance", "token": "test", "mode": "file", "filename": name,
                          "ocr": name.startswith("scanned"),
                          "base64": base64.b64encode((ROOT / "tests" / "fixtures" / name).read_bytes()).decode("ascii")})
    result = json.loads(container(["--conditions=react-server", "--import=tsx", "--input-type=module", "-e", program], payload))
    if result.get("kind") != "pdf" or not any(len(p["text"]) > 20 for p in result["pages"]):
        raise SystemExit("PDF extraction failed.")
    if name.startswith("scanned"):
        if ([p["page"] for p in result["pages"]] != [1, 2]
            or "sete dias" not in result["pages"][0]["text"]
            or "segundo fator" not in result["pages"][1]["text"]
            or result["pages"][0].get("ocr", {}).get("language") != "por"):
            raise SystemExit("Portuguese OCR/page preservation failed.")
    print(f"{name}: PDF/OCR verified without root or network.", flush=True)
