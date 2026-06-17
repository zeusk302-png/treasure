# -*- coding: utf-8 -*-
"""실습 커리큘럼 결과(JSON)를 읽어 docs/practice/curriculum.md 와 examples/_catalog.json 생성.
examples/<id>/ 또는 <id>-*/ 폴더 존재 여부로 '코드 준비됨'을 표시한다."""
import json, os, glob, sys
from collections import OrderedDict

ROOT = r"C:\Users\김세영\Desktop\부산코딩스쿨_강의자료\treasure"
# 인자로 원본 JSON 경로를 받거나, 없으면 examples/_catalog.json 으로 재생성
SRC = sys.argv[1] if len(sys.argv) > 1 else None

def find_categories(obj):
    if isinstance(obj, list):
        if obj and isinstance(obj[0], dict) and "exercises" in obj[0] and "code" in obj[0]:
            return obj
        for it in obj:
            r = find_categories(it)
            if r: return r
    elif isinstance(obj, dict):
        for v in obj.values():
            r = find_categories(v)
            if r: return r
    elif isinstance(obj, str):
        s = obj.strip()
        if s.startswith("["):
            try:
                return find_categories(json.loads(s))
            except Exception:
                pass
    return None

cat_json_path = os.path.join(ROOT, "examples", "_catalog.json")

if SRC:
    with open(SRC, encoding="utf-8") as f:
        data = json.load(f)
    cats = find_categories(data)
    assert cats, "categories not found in source"
    cats = sorted(cats, key=lambda c: c.get("code", ""))
    catalog = []
    gid = 0
    cat_meta = OrderedDict()
    for c in cats:
        cat_meta[c["code"]] = c["name"]
        for ex in c["exercises"]:
            gid += 1
            catalog.append({
                "id": "%03d" % gid,
                "code": c["code"],
                "category": c["name"],
                "title": ex["title"],
                "goal": ex["goal"],
                "difficulty": int(ex.get("difficulty", 1)),
                "concept": ex.get("concept", ""),
                "deliverable": ex.get("deliverable", ""),
            })
    os.makedirs(os.path.join(ROOT, "examples"), exist_ok=True)
    with open(cat_json_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
else:
    with open(cat_json_path, encoding="utf-8") as f:
        catalog = json.load(f)
    cat_meta = OrderedDict()
    for x in catalog:
        cat_meta.setdefault(x["code"], x["category"])

def has_code(cid):
    base = os.path.join(ROOT, "examples")
    return bool(glob.glob(os.path.join(base, cid)) + glob.glob(os.path.join(base, cid + "-*")))

def stars(n):
    n = max(1, min(5, int(n)))
    return "★" * n + "☆" * (5 - n)

def esc(s):
    return str(s).replace("|", "\\|").replace("\n", " ")

REPO = "https://github.com/zeusk302-png/treasure/tree/main/examples"
total = len(catalog)
done = sum(1 for x in catalog if has_code(x["id"]))

L = []
L.append("# 실습 300선 — 1년 커리큘럼")
L.append("")
L.append("> 비전공자가 단계별로 따라 할 수 있는 실습 **%d개**. 쉬움(★)부터 종합 프로젝트(★★★★★)까지, 카테고리별로 한 단계씩 쌓입니다. 코드·설명서가 준비되는 대로 '코드' 칸에 링크가 채워집니다. **(현재 %d / %d 준비됨)**" % (total, done, total))
L.append("")
L.append('!!! tip "난이도 읽는 법"')
L.append("    ★ 입문 · ★★ 기초 · ★★★ 중급 · ★★★★ 응용 · ★★★★★ 종합·프로젝트")
L.append("")
L.append("## 카테고리 한눈에")
L.append("")
L.append("| 코드 | 카테고리 | 개수 |")
L.append("|---|---|---|")
counts = OrderedDict()
for x in catalog:
    counts[x["code"]] = counts.get(x["code"], 0) + 1
for code, name in cat_meta.items():
    L.append("| %s | %s | %d |" % (code, name, counts.get(code, 0)))

cur = None
for x in catalog:
    if x["code"] != cur:
        cur = x["code"]
        L.append("")
        L.append("## %s. %s" % (x["code"], x["category"]))
        L.append("")
        L.append("| # | 실습 | 목표 | 난이도 | 개념 | 코드 |")
        L.append("|---|---|---|---|---|---|")
    code_cell = "[코드](%s/%s)" % (REPO, x["id"]) if has_code(x["id"]) else "준비중"
    L.append("| %s | %s | %s | %s | %s | %s |" % (x["id"], esc(x["title"]), esc(x["goal"]), stars(x["difficulty"]), esc(x["concept"]), code_cell))

os.makedirs(os.path.join(ROOT, "docs", "practice"), exist_ok=True)
with open(os.path.join(ROOT, "docs", "practice", "curriculum.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(L) + "\n")

print("catalog:", total, "exercises,", done, "with code")
print("by category:", dict(counts))
