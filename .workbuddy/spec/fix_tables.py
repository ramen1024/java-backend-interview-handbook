import json, os, re, glob

BASE = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
SPEC = os.path.join(BASE, ".workbuddy/spec")
DOCS = os.path.join(BASE, "docs")

data = {}
for name in ("prereq_a.json", "prereq_b.json", "prereq_c.json"):
    with open(os.path.join(SPEC, name), encoding="utf-8") as f:
        data.update(json.load(f))

NEW_HDR = "| 编号 | 题目 | 面试难度 | 阅读门槛 | 优先级 | 一句话答案 |"
NEW_SEP = "| --- | --- | --- | --- | --- | --- |"
ROW = re.compile(r"^\|\s*(Q\d+)\s*\|")

for path in sorted(glob.glob(os.path.join(DOCS, "0[0-9]-*.md"))):
    base = os.path.basename(path)
    key = base[:2]
    if key not in data:
        continue
    items = data[key]
    lines = open(path, encoding="utf-8").read().split("\n")
    out, fixed, hdr = [], 0, 0
    i = 0
    while i < len(lines):
        ln = lines[i]
        if ("编号" in ln and "题目" in ln and "难度" in ln
                and "阅读门槛" not in ln and ln.startswith("|")):
            out.append(NEW_HDR)
            hdr += 1
            if i + 1 < len(lines) and re.match(r"^\|[\s\-:|]+\|$", lines[i + 1]):
                out.append(NEW_SEP)
                i += 2
                continue
            i += 1
            continue
        m = ROW.match(ln)
        if m:
            cells = [c.strip() for c in ln.strip().strip("|").split("|")]
            if len(cells) == 5:
                qn = int(m.group(1)[1:])
                bar = items[qn - 1][1]
                cells.insert(3, bar)
                ln = "| " + " | ".join(cells) + " |"
                fixed += 1
        out.append(ln)
        i += 1
    t = "\n".join(out)
    open(path, "w", encoding="utf-8", newline="\n").write(t)
    print(f"{base:40} 表头 {hdr}  加列 {fixed}")
