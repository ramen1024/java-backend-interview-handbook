import json, os, re, glob, sys

BASE = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
SPEC = os.path.join(BASE, ".workbuddy/spec")
DOCS = os.path.join(BASE, "docs")

data = {}
for name in ("prereq_a.json", "prereq_b.json", "prereq_c.json"):
    with open(os.path.join(SPEC, name), encoding="utf-8") as f:
        data.update(json.load(f))

HEAD = re.compile(r"^(### (Q\d+)\. .*)$", re.M)
OLD_HDR = "| 编号 | 题目 | 难度 | 优先级 | 一句话答案 |"
NEW_HDR = "| 编号 | 题目 | 面试难度 | 阅读门槛 | 优先级 | 一句话答案 |"
OLD_SEP = "| --- | --- | --- | --- | --- |"
NEW_SEP = "| --- | --- | --- | --- | --- | --- |"

report = []
for path in sorted(glob.glob(os.path.join(DOCS, "*.md"))):
    base = os.path.basename(path)
    m = re.match(r"(\d{2})-", base)
    if not m or m.group(1) not in data:
        continue
    key = m.group(1)
    items = data[key]
    t = open(path, encoding="utf-8").read()

    n_head = len(HEAD.findall(t))
    if n_head != len(items):
        print(f"[跳过] {base}: 标题 {n_head} 个，数据 {len(items)} 条，数量不一致")
        sys.exit(1)

    # 1) 插入前置行
    def add_prereq(mo):
        line, qn = mo.group(1), mo.group(2)
        pre, _bar = items[int(qn[1:]) - 1]
        return f"{line}\n\n> 前置：{pre}"

    if "> 前置：" not in t:
        t = HEAD.sub(add_prereq, t)

    # 2) 表格加门槛列
    if OLD_HDR in t:
        t = t.replace(OLD_HDR + "\n" + OLD_SEP, NEW_HDR + "\n" + NEW_SEP)

    lines = t.split("\n")
    out, fixed = [], 0
    for ln in lines:
        mm = re.match(r"^\| (Q\d+) \|", ln)
        if mm:
            cells = ln.split("|")
            if len(cells) != 7:
                print(f"[错误] {base} 行结构异常：{ln[:60]} -> {len(cells)} 段")
                sys.exit(1)
            qn = int(mm.group(1)[1:])
            bar = items[qn - 1][1]
            if len(cells) == 7 and cells[4].strip() not in ("低", "中", "高"):
                cells.insert(4, f" {bar} ")
                ln = "|".join(cells)
                fixed += 1
        out.append(ln)

    t = "\n".join(out)
    open(path, "w", encoding="utf-8", newline="\n").write(t)
    report.append((base, n_head, len(items), fixed, t.count("> 前置：")))

print(f"{'file':40}{'题数':>5}{'数据':>5}{'加列':>5}{'前置行':>6}")
print("-" * 62)
tq = 0
for base, n, ni, fixed, pre in report:
    print(f"{base:40}{n:5}{ni:5}{fixed:5}{pre:6}")
    tq += n
print("-" * 62)
print(f"合计 {len(report)} 章，{tq} 题")
