import os, re, sys, glob

BASE = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
docs = os.path.join(BASE, "docs")
files = sorted(glob.glob(os.path.join(docs, "*.md")))

emoji = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27BF]")

print(f"{'file':44} {'chars':>7} {'Q':>3} {'结论':>4} {'前置':>4} {'门槛':>4} {'追问':>4} {'表':>3} {'图':>3} {'实验':>4}")
print("-" * 96)
total = 0
fail = 0
for f in files:
    t = open(f, encoding="utf-8").read()
    chars = len(re.sub(r"\s", "", t))
    total += chars
    q = len(re.findall(r"^### Q\d+", t, re.M))
    concl = len(re.findall(r"^\*\*一句话结论\*\*", t, re.M))
    prereq = len(re.findall(r"^> 前置：", t, re.M))
    bar = len(re.findall(r"^\| Q\d+ \|.*\| (?:低|中|高) \|", t, re.M))
    follow = t.count("追问：")
    tables = len(re.findall(r"^\|\s*---", t, re.M))
    charts = t.count("```mermaid")
    labs = t.count("## 七、动手实验与失败现象")
    bad = emoji.findall(t)
    flag = ""
    if bad:
        flag += f" EMOJI:{len(bad)}"
    if q != concl:
        flag += f" Q!=结论({q}/{concl})"
    if q and prereq != q:
        flag += f" 前置缺失({prereq}/{q})"
        fail += 1
    if q and bar != q:
        flag += f" 门槛缺失({bar}/{q})"
        fail += 1
    print(f"{os.path.basename(f):44} {chars:7} {q:3} {concl:4} {prereq:4} {bar:4} {follow:4} {tables:3} {charts:3} {labs:4}{flag}")

print("-" * 96)
print(f"总字符数（去空白）: {total}")
print("校验结果:", "通过" if fail == 0 else f"{fail} 项不通过")
