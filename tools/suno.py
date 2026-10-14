"""suno.py: ONE public Suno track by its link -> audio + lyrics + metadata, to make a clip for YOUR song.
  python3 tools/suno.py https://suno.com/s/XXXX   (or suno.com/song/<uuid>, or the bare uuid)  [out_dir]
-> out/suno/<slug>/{track.m4a, cover.jpg, lyrics.txt, meta.json}
Only your own tracks or with the author's permission: Suno's ToS forbids automated collection, so no bulk mode here.
Private tracks can't be fetched (their audio is encrypted): publish the track or download it from Suno yourself.
Lyrics are cleaned for subtitles: [Verse]-style tags dropped, CAPS stress marks (ресЭт) lowered. Stdlib + ffmpeg."""
import json, re, subprocess, sys, urllib.request
from pathlib import Path

API, UA = "https://studio-api-prod.suno.com/api", {"User-Agent": "Mozilla/5.0 (Macintosh) Chrome/140 Safari/537.36"}

def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read(), r.geturl()

def clip_id(link):
    m = re.search(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", link)
    if m: return m[0]
    _, final = fetch(link)                                   # short share link /s/XXXX redirects to /song/<uuid>
    m = re.search(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", final)
    if not m: sys.exit(f"no song id in {final}")
    return m[0]

def clean_lyrics(text):
    out = []
    for line in (text or "").splitlines():
        line = re.sub(r"\[[^\]]*\]|\([^)]*\)$", "", line).strip()       # [Chorus], [Verse 2: ...], trailing (ad-libs)
        line = re.sub(r"(?<=[а-яё])[А-ЯЁ]", lambda m: m[0].lower(), line)   # stress caps: ресЭт -> ресэт
        if line or (out and out[-1]): out.append(line)
    return "\n".join(out).strip() + "\n"

def main():
    if len(sys.argv) < 2: sys.exit(__doc__)
    cid = clip_id(sys.argv[1]); c = json.loads(fetch(f"{API}/clip/{cid}")[0]); m = c.get("metadata") or {}
    slug = re.sub(r"[^\w]+", "_", (c.get("title") or cid).lower()).strip("_")[:40] or cid[:8]
    d = Path(sys.argv[2] if len(sys.argv) > 2 else "out/suno") / slug; d.mkdir(parents=True, exist_ok=True)
    # the m4a in media_urls is encrypted for the web player; the public share mp4 carries the same AAC -> copy it out, no re-encode
    (d / "suno.mp4").write_bytes(fetch(c.get("video_url") or f"https://cdn1.suno.ai/{cid}.mp4")[0])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", d / "suno.mp4", "-vn", "-c:a", "copy", d / "track.m4a"], check=True)
    (d / "suno.mp4").unlink()
    if c.get("image_large_url"): (d / "cover.jpg").write_bytes(fetch(c["image_large_url"])[0])
    (d / "lyrics.txt").write_text(clean_lyrics(m.get("prompt")))
    meta = {"id": cid, "title": c.get("title"), "artist": c.get("display_name"), "url": f"https://suno.com/song/{cid}",
            "style": m.get("tags"), "duration": m.get("duration"), "model": c.get("major_model_version"), "created": c.get("created_at")}
    (d / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
    print(d, meta["title"], "—", meta["artist"], f'{meta["duration"] or 0:.0f} s')

if __name__ == "__main__":
    main()
