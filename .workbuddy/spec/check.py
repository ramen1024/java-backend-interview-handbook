import os, re, sys, glob

BASE = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
docs = os.path.join(BASE, "docs")
files = sorted(glob.glob(os.path.join(docs, "*.md")))

emoji = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27BF]")

print(f"{'file':46} {'chars':>7} {'Q':>3} {'结论':>4} {'追问':>4} {'表':>3} {'图':>3}")
print("-" * 82)
total = 0
for f in files:
    t = open(f, encoding="utf-8").read()
    chars = len(re.sub(r"\s", "", t))
    total += chars
    q = len(re.findall(r"^### Q\d+", t, re.M))
    concl = t.count("一句话结论")
    follow = t.count("追问：")
    tables = len(re.findall(r"^\|\s*---", t, re.M))
    charts = t.count("```mermaid")
    bad = emoji.findall(t)
    flag = ""
    if bad:
        flag += f" EMOJI:{len(bad)}"
    if q != concl:
        flag += f" Q!=结论({q}/{concl})"
    print(f"{os.path.basename(f):46} {chars:7} {q:3} {concl:4} {follow:4} {tables:3} {charts:3}{flag}")

print("-" * 82)
print(f"总字符数（去空白）: {total}")
