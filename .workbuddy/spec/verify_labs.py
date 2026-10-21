import os, re, glob, subprocess, sys, shutil

BASE = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
DOCS = os.path.join(BASE, "docs")
OUT = os.path.join(BASE, ".workbuddy/spec/verify")
if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)

names = []
for f in sorted(glob.glob(os.path.join(DOCS, "*.md"))):
    t = open(f, encoding="utf-8").read()
    idx = t.find("## 七、动手实验与失败现象")
    if idx < 0:
        continue
    tail = t[idx:]
    for block in re.findall(r"```java\n(.*?)```", tail, re.S):
        m = re.search(r"public class (\w+)", block)
        if not m:
            print(f"[警告] {os.path.basename(f)} 有代码块缺少 public class")
            continue
        name = m.group(1)
        path = os.path.join(OUT, name + ".java")
        open(path, "w", encoding="utf-8").write(block)
        names.append((os.path.basename(f), name))

print(f"抽取 {len(names)} 个程序：")
for f, n in names:
    print(f"  {f:34} {n}")

r = subprocess.run(["javac", "-encoding", "UTF-8", "-d", os.path.join(OUT, "classes")]
                   + [os.path.join(OUT, n + ".java") for _, n in names],
                   capture_output=True, text=True)
print("\n编译结果:", "通过" if r.returncode == 0 else "失败")
if r.returncode != 0:
    print(r.stdout)
    print(r.stderr)
    sys.exit(1)
