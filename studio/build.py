"""Assemble studio/src/* into studio/studio-cote-bleue.html (the page published on claude.ai)."""
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
HEAD = (
    "<title>Studio Côte Bleue</title>\n"
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600'
    '&family=Nunito:wght@400;600;700;800&display=swap">\n'
)

css = (SRC / "styles.css").read_text()
body = (SRC / "body.html").read_text()
js = (SRC / "gabarits.js").read_text() + "\n" + (SRC / "interface.js").read_text()
page = f"{HEAD}<style>{css}</style>\n\n{body}\n<script>\n(function(){{\n{js}\n}})();\n</script>\n"
(ROOT / "studio-cote-bleue.html").write_text(page)
print(f"studio-cote-bleue.html: {len(page)} caractères")
