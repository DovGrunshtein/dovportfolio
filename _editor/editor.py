#!/usr/bin/env python3
"""Local editor for the portfolio: order, add, edit and delete videos, pictures and categories, then publish.

Run:  python3 _editor/editor.py   then open http://127.0.0.1:8765/_editor/
Only listens on 127.0.0.1. The _editor folder is skipped by GitHub Pages (Jekyll).
"""
import hashlib
import html
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent.parent
PORT = 8765
PAGES = ["projects.html", "motion.html", "pictures.html"]

ITEM_START = re.compile(r'<div class="(video-thumbnail|masonry-item)\b')
SECTION_START = re.compile(r'<section id="([^"]+)" class="project-section"')
SECTION_TITLE = re.compile(r'<h2 class="section-title"[^>]*>(.*?)</h2>')
MASONRY_TITLE = re.compile(r'<h2 class="masonry-category-title" id="([^"]+)"[^>]*>(.*?)</h2>')
VIDEO_ROW = re.compile(r'<div class="video-row (\w+)"')
NAV_LINK = re.compile(r'<li><a href="#([^"]+)">(.*?)</a></li>')
H2_TEXT = re.compile(r"(<h2[^>]*>)(.*?)(</h2>)")
COMMENT = re.compile(r"^\s*<!--.*-->\s*$")
ATTR = lambda name: re.compile(name + r'="([^"]*)"')
YOUTUBE_ID = re.compile(r"[A-Za-z0-9_-]{11}")
WEB_IMAGE = {".jpg", ".jpeg", ".png", ".webp"}
GALLERY_THUMB_SIZE = 600   # longest side, px
VIDEO_THUMB_SIZE = 1280
# Never published by the Publish button.
GIT_EXCLUDE = [":(exclude,glob)**/.DS_Store", ":(exclude,glob).history/**"]


def fingerprint(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


def indent_of(line):
    return re.match(r"[ \t]*", line).group(0)


def read_lines(page):
    with open(ROOT / page, encoding="utf-8", newline="") as f:
        lines = f.read().splitlines(keepends=True)
    return lines, ("\r\n" if lines and lines[0].endswith("\r\n") else "\n")


def write_lines(page, lines):
    with open(ROOT / page, "w", encoding="utf-8", newline="") as f:
        f.write("".join(lines))


def parse(page):
    """Return (lines, groups). A group is one category: a <section> of videos or a gallery heading."""
    lines, _ = read_lines(page)
    groups, current, nav, i = [], None, {}, 0

    def open_group(gid, title, kind, n):
        g = {"id": gid, "title": html.unescape(title), "kind": kind, "items": [],
             "head": n, "title_line": n, "insert_at": n + 1, "row": "", "indent": indent_of(lines[n]) + "  "}
        groups.append(g)
        return g

    while i < len(lines):
        line = lines[i]
        if NAV_LINK.search(line):
            nav.setdefault(NAV_LINK.search(line).group(1), i)
        if SECTION_START.search(line):
            current = open_group(SECTION_START.search(line).group(1), SECTION_START.search(line).group(1).upper(), "video", i)
        elif current and current["kind"] == "video" and not current["items"] and SECTION_TITLE.search(line):
            current["title"] = html.unescape(SECTION_TITLE.search(line).group(1))
            current["title_line"] = i
        elif current and current["kind"] == "video" and not current["items"] and VIDEO_ROW.search(line):
            current["row"] = VIDEO_ROW.search(line).group(1)
            current["insert_at"] = i + 1
            current["indent"] = indent_of(line) + "  "
        elif MASONRY_TITLE.search(line):
            m = MASONRY_TITLE.search(line)
            current = open_group(m.group(1), m.group(2), "gallery", i)
            current["indent"] = indent_of(line)
            if i > 0 and COMMENT.match(lines[i - 1]):
                current["head"] = i - 1
        elif "</section>" in line:
            if current:
                current["section_end"] = i
            current = None
        elif "</main>" in line:
            current = None
        elif current is not None and ITEM_START.search(line):
            start = i
            while start > 0 and COMMENT.match(lines[start - 1]):
                start -= 1
            end = i
            if "</div>" not in line[ITEM_START.search(line).end():]:
                while end + 1 < len(lines) and lines[end].strip() != "</div>":
                    end += 1
            text = "".join(lines[start:end + 1])
            body = "".join(lines[i:end + 1])
            get = lambda n: html.unescape((ATTR(n).search(body) or [None, ""])[1])
            current["items"].append({
                "start": start, "end": end, "text": text, "fp": fingerprint(text), "body": body,
                "title": get("alt"), "thumb": get("src"),
                "youtube": get("data-youtube-id"), "full": get("data-full"),
            })
            i = end
        i += 1

    for g in groups:
        items = g["items"]
        g["nav"] = nav.get(g["id"])
        folders = [str(Path(it["full"]).parent) for it in items if it["full"]]
        g["folder"] = max(set(folders), key=folders.count) if folders else "images/" + safe_name(g["title"])
        if not items:
            g.update(editable=True, region=(g["insert_at"], g["insert_at"]), gaps=[], end=g["title_line"])
            continue
        covered = set()
        for it in items:
            covered.update(range(it["start"], it["end"] + 1))
        region = range(items[0]["start"], items[-1]["end"] + 1)
        g["editable"] = not [n for n in region if n not in covered and lines[n].strip()]
        g["region"] = (region.start, region.stop)
        g["end"] = items[-1]["end"]
        # Whitespace between consecutive items, reused by position so a save only touches moved items.
        g["gaps"] = ["".join(lines[a["end"] + 1:b["start"]]) for a, b in zip(items, items[1:])]
    return lines, groups


def layout():
    out = []
    for page in PAGES:
        if not (ROOT / page).exists():
            continue
        _, groups = parse(page)
        out.append({"page": page, "kind": groups[0]["kind"] if groups else "video", "groups": [{
            "id": g["id"], "title": g["title"], "editable": g["editable"], "kind": g["kind"],
            "folder": g["folder"], "row": g["row"],
            "items": [{k: it[k] for k in ("fp", "title", "thumb", "youtube", "full")} for it in g["items"]],
        } for g in groups]})
    return out


# ---------- items ----------

def set_attr(attr, value, text):
    value = html.escape(value, quote=True)
    return re.sub(r'\b' + attr + r'="[^"]*"', lambda _: f'{attr}="{value}"', text, count=1)


def check_youtube(yt):
    if not YOUTUBE_ID.fullmatch(yt or ""):
        raise ValueError(f"Invalid YouTube id: {yt}")
    return yt


def item_template(g, nl):
    """Markup to copy for a new item: the group's first item, or a default for an empty category."""
    if g["items"]:
        return g["items"][0]["body"]
    ind = g["indent"]
    if g["kind"] == "gallery":
        return f'{ind}<div class="masonry-item" data-aos="fade-up"><img src="" data-full="" loading="lazy" alt=""></div>{nl}'
    cls = "youtube-thumbnail vertical" if g["row"] == "vertical" else "youtube-thumbnail"
    return (f'{ind}<div class="video-thumbnail {cls}" data-youtube-id="" data-aos="zoom-in-up">{nl}'
            f'{ind}  <img src="" alt="" loading="lazy" />{nl}{ind}</div>{nl}')


def new_item_text(g, new, nl):
    template = item_template(g, nl)
    text = re.sub(r'\s*data-aos-delay="[^"]*"', "", template)
    thumb = new.get("thumb") or ""
    if g["kind"] == "video":
        yt = check_youtube(new.get("youtube"))
        thumb = thumb or f"https://i.ytimg.com/vi/{yt}/hqdefault.jpg"
        text = set_attr("data-youtube-id", yt, text)
        text = f"{indent_of(template)}<!-- NEW: {html.escape(new.get('title') or yt)} -->{nl}" + text
    else:
        text = set_attr("data-full", new.get("full") or "", text)
    text = set_attr("src", thumb, text)
    return set_attr("alt", new.get("title") or "", text)


def edited_item_text(item, edit):
    """Apply changed fields (title / youtube / thumb / full) to an existing item's HTML."""
    text = item["text"]
    if "youtube" in edit:
        text = set_attr("data-youtube-id", check_youtube(edit["youtube"]), text)
    if "thumb" in edit:
        text = set_attr("src", edit["thumb"], text)
    if "full" in edit:
        text = set_attr("data-full", edit["full"], text)
    if "title" in edit:
        text = set_attr("alt", edit["title"], text)
        text = re.sub(r"<!-- NEW: .*? -->", lambda _: f"<!-- NEW: {html.escape(edit['title'])} -->", text, count=1)
    return text


def save(page, changes):
    """changes: {group_id: [fp | {"new": {...}} | {"fp": fp, "edit": {...}}, ...]} in the new order.
    Existing items whose fp is missing are deleted."""
    if page not in PAGES:
        raise ValueError("Unknown page")
    lines, groups = parse(page)
    _, nl = read_lines(page)
    by_id = {g["id"]: g for g in groups}
    edits = []
    for gid, order in changes.items():
        g = by_id.get(gid)
        if not g or not g["editable"]:
            raise ValueError(f"Group {gid} cannot be edited")
        pool = {}
        for it in g["items"]:
            pool.setdefault(it["fp"], []).append(it)
        ordered = []
        for entry in order:
            if isinstance(entry, dict) and "new" in entry:
                ordered.append(new_item_text(g, entry["new"], nl))
                continue
            fp, edit = (entry["fp"], entry["edit"]) if isinstance(entry, dict) else (entry, None)
            if not pool.get(fp):
                raise ValueError(f"{g['title']}: the file changed on disk, reload the editor")
            item = pool[fp].pop(0)
            ordered.append(edited_item_text(item, edit) if edit else item["text"])
        gaps = g["gaps"]
        if gaps:
            default_gap = nl if any(gap and not gap.strip() for gap in gaps) else ""
        else:
            default_gap = nl if g["kind"] == "video" else ""
        out = []
        for n, text in enumerate(ordered):
            if n:
                out.append(gaps[n - 1] if n - 1 < len(gaps) else default_gap)
            out.append(text if text.endswith(("\n", "\r\n")) else text + nl)
        edits.append((g["region"], "".join(out)))
    for (start, stop), text in sorted(edits, reverse=True):
        lines[start:stop] = [text]
    write_lines(page, lines)


# ---------- categories ----------

def safe_name(title):
    name = re.sub(r'[\\/:*?"<>|#%&\']', "", title)
    return re.sub(r"\s+", " ", name).strip() or "New"


def slugify(title, existing):
    s = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-") or "category"
    base, n = s, 2
    while s in existing:
        s, n = f"{base}-{n}", n + 1
    return s


def category(page, action, gid="", title="", row="vertical"):
    if page not in PAGES:
        raise ValueError("Unknown page")
    lines, groups = parse(page)
    _, nl = read_lines(page)
    title = (title or "").strip()
    t = html.escape(title)
    if action in ("add", "rename") and not title:
        raise ValueError("Category name is empty")
    by_id = {g["id"]: g for g in groups}

    if action == "add":
        if not groups:
            raise ValueError("No existing category to copy the layout from")
        last = groups[-1]
        slug = slugify(title, set(re.findall(r'\bid="([^"]+)"', "".join(lines))))
        if last["kind"] == "video":
            if row not in ("vertical", "horizontal"):
                raise ValueError("Bad layout")
            ind = indent_of(lines[last["head"]])
            at = last["section_end"] + 1
            block = [nl, f'{ind}<section id="{slug}" class="project-section">{nl}',
                     f'{ind}  <h2 class="section-title" data-aos="fade-up">{t}</h2>{nl}',
                     f'{ind}  <div class="video-row {row}">{nl}', f'{ind}  </div>{nl}', f'{ind}</section>{nl}']
        else:
            ind = indent_of(lines[last["title_line"]])
            at = last["end"] + 1
            block = [nl, f"{ind}<!-- {t} -->{nl}",
                     f'{ind}<h2 class="masonry-category-title" id="{slug}" data-aos="fade-up">{t}</h2>{nl}']
        lines[at:at] = block
        navs = [g["nav"] for g in groups if g["nav"] is not None]
        if navs:  # nav menu sits above the categories, so its line numbers are unaffected
            n = max(navs)
            lines.insert(n + 1, NAV_LINK.sub(lambda _: f'<li><a href="#{slug}">{t}</a></li>', lines[n], count=1))
        write_lines(page, lines)
        return {"id": slug}

    g = by_id.get(gid)
    if not g:
        raise ValueError("Category not found, reload the editor")

    if action == "rename":
        lines[g["title_line"]] = H2_TEXT.sub(lambda m: m.group(1) + t + m.group(3), lines[g["title_line"]], count=1)
        if g["kind"] == "gallery" and g["head"] != g["title_line"]:
            lines[g["head"]] = f"{indent_of(lines[g['head']])}<!-- {t} -->{nl}"
        if g["nav"] is not None:
            lines[g["nav"]] = NAV_LINK.sub(lambda m: f'<li><a href="#{m.group(1)}">{t}</a></li>', lines[g["nav"]], count=1)
    elif action == "delete":
        if g["items"]:
            raise ValueError("Delete or move all items in the category first")
        if len(groups) == 1:
            raise ValueError("Can't delete the only category on the page")
        start = g["head"]
        stop = (g["section_end"] if g["kind"] == "video" else g["title_line"]) + 1
        if start > 0 and not lines[start - 1].strip():
            start -= 1
        del lines[start:stop]
        if g["nav"] is not None:
            del lines[g["nav"]]
    else:
        raise ValueError("Unknown action")
    write_lines(page, lines)
    return {"id": gid}


# ---------- uploads ----------

def unique_path(folder, name):
    path = folder / name
    n = 1
    while path.exists():
        path = folder / f"{Path(name).stem}-{n}{Path(name).suffix}"
        n += 1
    return path


def sips(src, dest, size=None):
    cmd = ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "85"]
    if size:
        cmd += ["-Z", str(size)]
    subprocess.run(cmd + [str(src), "--out", str(dest)], check=True, capture_output=True)


def upload(kind, filename, data, folder=""):
    """Save an uploaded image. gallery: full image + thumbnail. video: thumbnail only. Returns site-relative paths."""
    name = safe_name(Path(filename).name)
    stem, ext = Path(name).stem, Path(name).suffix.lower()
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / f"upload{ext}"
        src.write_bytes(data)
        if kind == "gallery":
            images = (ROOT / "images").resolve()
            target = (ROOT / folder).resolve()
            if images not in target.parents:
                raise ValueError("Bad folder")
            target.mkdir(parents=True, exist_ok=True)
            if ext in WEB_IMAGE:
                full = unique_path(target, stem + ext)
                full.write_bytes(data)
            else:  # e.g. HEIC, convert so browsers can show it
                full = unique_path(target, stem + ".jpg")
                sips(src, full)
            thumb = unique_path(ROOT / "thumbnails" / "images", f"{full.stem}_thumb.jpg")
            sips(src, thumb, GALLERY_THUMB_SIZE)
            return {"full": full.relative_to(ROOT).as_posix(), "thumb": thumb.relative_to(ROOT).as_posix()}
        thumb = unique_path(ROOT / "thumbnails" / "videos", f"{stem}.jpg")
        sips(src, thumb, VIDEO_THUMB_SIZE)
        return {"thumb": thumb.relative_to(ROOT).as_posix()}


# ---------- publish (git) ----------

def git(*args, check=True):
    r = subprocess.run(["git", "-c", "core.quotepath=false", *args], cwd=ROOT, capture_output=True, text=True,
                       timeout=180, env={**os.environ, "GIT_TERMINAL_PROMPT": "0"})
    if check and r.returncode:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return r


def git_status():
    files = [l[3:].strip('"') for l in git("status", "--porcelain", "-uall", "--", ".", *GIT_EXCLUDE).stdout.splitlines()]
    ahead = git("rev-list", "--count", "@{u}..HEAD", check=False)
    return {"files": files, "ahead": int(ahead.stdout.strip() or 0) if ahead.returncode == 0 else 0,
            "branch": git("rev-parse", "--abbrev-ref", "HEAD").stdout.strip()}


def publish(message):
    git("add", "-A", "--", ".", *GIT_EXCLUDE)
    committed = git("diff", "--cached", "--quiet", check=False).returncode == 1
    if committed:
        git("commit", "-m", message.strip() or "Content update")
    push = git("push", check=False)
    if push.returncode:
        if not re.search(r"rejected|fetch first|non-fast-forward", push.stderr):
            raise RuntimeError("Push failed: " + push.stderr.strip())
        # Someone changed the site on GitHub (e.g. edited a file on github.com): bring that in, then push again.
        pull = git("pull", "--rebase", "--autostash", check=False)
        if pull.returncode:
            git("rebase", "--abort", check=False)
            raise RuntimeError("GitHub has changes that conflict with yours. Your changes are saved locally "
                               "as a commit, nothing was lost, but they were not published.")
        git("push")
    return {"committed": committed}


# ---------- server ----------

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        try:
            if self.path == "/api/layout":
                return self.send_json(200, layout())
            if self.path == "/api/git":
                return self.send_json(200, git_status())
        except Exception as e:
            return self.send_json(400, {"error": str(e)})
        if self.path in ("/", ""):
            self.send_response(302)
            self.send_header("Location", "/_editor/")
            return self.end_headers()
        super().do_GET()

    def do_POST(self):
        url = urlparse(self.path)
        if url.path not in ("/api/save", "/api/upload", "/api/category", "/api/publish"):
            return self.send_json(404, {"error": "not found"})
        if self.headers.get("Origin") not in (None, f"http://127.0.0.1:{PORT}", f"http://localhost:{PORT}"):
            return self.send_json(403, {"error": "forbidden"})
        try:
            body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            if url.path == "/api/upload":
                q = {k: v[0] for k, v in parse_qs(url.query).items()}
                return self.send_json(200, upload(q.get("kind"), q.get("name", ""), body, q.get("folder", "")))
            data = json.loads(body)
            if url.path == "/api/category":
                return self.send_json(200, category(data["page"], data["action"], data.get("id", ""),
                                                    data.get("title", ""), data.get("row", "vertical")))
            if url.path == "/api/publish":
                return self.send_json(200, publish(data.get("message", "")))
            for page, changes in data.items():
                save(page, changes)
            self.send_json(200, {"ok": True})
        except subprocess.CalledProcessError as e:
            self.send_json(400, {"error": "Could not read the image: " + e.stderr.decode(errors="ignore").strip()})
        except Exception as e:
            self.send_json(400, {"error": str(e)})


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), partial(Handler, directory=str(ROOT)))
    url = f"http://127.0.0.1:{PORT}/_editor/"
    print(f"Editor running at {url}  (Ctrl+C to stop)")
    if "--no-browser" not in sys.argv:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
