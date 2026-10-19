"""Download the two public NLM samples used by this evaluation, never user data."""
import hashlib
import json
import pathlib
import re
import subprocess
import urllib.request

root = pathlib.Path(__file__).resolve().parent
sources = []
for name, slug in [
    ("naloxone", "how-naloxone-saves-lives-in-opioid-overdose"),
    ("antibiotics", "antibiotics-vs-bacteria-fighting-the-resistance"),
]:
    page = "https://medlineplus.gov/medlineplus-videos/" + slug + "/"
    with urllib.request.urlopen(page, timeout=60) as response:
        html = response.read().decode()
    entry = {"id": name, "page": page, "attribution": "Source: MedlinePlus, National Library of Medicine.", "licensePage": "https://medlineplus.gov/about/using/usingcontent/", "files": []}
    for kind, attr, ext in [("video", "data-video", "mp4"), ("captions", "data-captions", "srt")]:
        url = re.search(attr + '="([^"]+)"', html).group(1)
        if not url.startswith("https://medlineplus.gov/"):
            raise ValueError("Unexpected media host")
        with urllib.request.urlopen(url, timeout=120) as response:
            data = response.read()
        path = root / (name + "." + ext)
        if path.exists() and path.read_bytes() != data:
            raise ValueError("Source changed; preserve existing evidence before downloading again")
        path.write_bytes(data)
        entry["files"].append({"kind": kind, "url": url, "path": path.name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    sources.append(entry)
    if not (root / (name + ".mp3")).exists():
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-n", "-i", str(root / (name + ".mp4")), "-vn", "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-q:a", "4", str(root / (name + ".mp3"))], check=True)
(root / "sources.json").write_text(json.dumps(sources, indent=2) + "\n")
