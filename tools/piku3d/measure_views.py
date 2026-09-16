"""
Measure Piku's build constants from the clean four-view reference set.

    python3 tools/piku3d/measure_views.py

These four views have white backgrounds, so the figure segments reliably —
unlike the composite model sheet, whose dark backdrop is the same value as
Piku's black body and cannot be auto-measured.

Features are found as CONNECTED COMPONENTS, not by colour thresholds alone:
Piku's glossy shading throws bright desaturated specular highlights that a bare
threshold reads as "white face mask" and bluish ones it reads as "shirt".
Taking the largest connected blob of each colour class rejects those.

Everything is reported normalised to total figure height, ready to drop into
piku_build.py. Head-local coords: u across the skull (-1..1), w up (+1 crown).
"""
import colorsys, os
from collections import deque
from PIL import Image

VIEWS = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))), "_reference", "piku", "views")

def load(name):
    im = Image.open(os.path.join(VIEWS, name)).convert("RGB")
    return im.load(), im.size[0], im.size[1]

def hsv(px, x, y):
    r, g, b = px[x, y]
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return h * 360, s, v

def silhouette(px, W, H):
    bg = lambda r, g, b: r > 243 and g > 243 and b > 243
    rows = {}
    for y in range(H):
        r = [x for x in range(W) if not bg(*px[x, y])]
        if len(r) > 2:
            rows[y] = r
    return rows

def components(pts, min_size=150):
    """Connected components (4-neighbour) of a point set, largest first."""
    S = set(pts)
    seen = set()
    out = []
    for p in pts:
        if p in seen:
            continue
        q = deque([p]); seen.add(p); comp = []
        while q:
            c = q.popleft(); comp.append(c)
            x, y = c
            for n in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
                if n in S and n not in seen:
                    seen.add(n); q.append(n)
        if len(comp) >= min_size:
            out.append(comp)
    out.sort(key=len, reverse=True)
    return out

CLS = {
    "white":  lambda px, x, y: hsv(px, x, y)[1] <= 0.12 and hsv(px, x, y)[2] >= 0.78,
    "orange": lambda px, x, y: 8 <= hsv(px, x, y)[0] <= 50 and hsv(px, x, y)[1] >= 0.60
                               and hsv(px, x, y)[2] >= 0.45,
    "blue":   lambda px, x, y: 195 <= hsv(px, x, y)[0] <= 245 and hsv(px, x, y)[1] >= 0.18
                               and hsv(px, x, y)[2] >= 0.45,
    "iris":   lambda px, x, y: 8 <= hsv(px, x, y)[0] <= 48 and 0.40 <= hsv(px, x, y)[1] <= 0.99
                               and 0.15 <= hsv(px, x, y)[2] <= 0.60,
    "dark":   lambda px, x, y: hsv(px, x, y)[2] <= 0.28,
}

def pick(px, rows, cls, ylo, yhi, xlo=None, xhi=None):
    f = CLS[cls]
    pts = [(x, y) for y in range(ylo, yhi) for x in rows.get(y, [])
           if (xlo is None or xlo <= x <= xhi) and f(px, x, y)]
    return components(pts)

def bbox(c):
    xs = [p[0] for p in c]; ys = [p[1] for p in c]
    return min(xs), max(xs), min(ys), max(ys)

def analyse_front():
    px, W, H = load("piku-front-view.png")
    rows = silhouette(px, W, H)
    ys = sorted(rows)
    y0, y1 = ys[0], ys[-1]
    TOT = y1 - y0
    allx = [x for r in rows.values() for x in r]
    N = lambda v: v / TOT
    F = lambda y: (y - y0) / TOT
    print(f"=== FRONT ===  figure {max(allx)-min(allx)} x {TOT}px   w/h {N(max(allx)-min(allx)):.3f}")

    # shoulder line = top of the largest blue component
    blue = pick(px, rows, "blue", y0, y1)
    shoulder = bbox(blue[0])[2]
    bx0, bx1, _, by1 = bbox(blue[0])
    print(f"  shoulder line      {F(shoulder):.4f}h")
    print(f"  shirt              {F(shoulder):.4f}h .. {F(by1):.4f}h   width {N(bx1-bx0):.4f}h")

    # skull circle from the silhouette above the shoulder
    best_y, best_w = None, 0
    for y in range(y0, shoulder):
        r = rows.get(y, [])
        if r and (max(r) - min(r)) > best_w:
            best_w, best_y = max(r) - min(r), y
    R, CY = best_w / 2, best_y
    # Centre on the SKULL, not the whole silhouette: the arms are not symmetric
    # and skew a figure-wide centre badly.
    CX = (min(rows[best_y]) + max(rows[best_y])) / 2
    print(f"  skull centre       {F(CY):.4f}h   radius {N(R):.4f}h   diam {N(2*R):.4f}h")
    print(f"  skull top/bottom   {F(CY-R):.4f}h / {F(CY+R):.4f}h")
    print(f"  quiff              0 .. {F(CY-R):.4f}h  ({N(CY-R-y0)/N(2*R):.3f} of head dia)")

    U = lambda x: (x - CX) / R
    Wl = lambda y: (CY - y) / R

    # --- face mask: largest white component in the head --------------------
    # The glasses frame cuts the mask into several pieces, so union every
    # white component inside the head rather than taking only the largest.
    wm = pick(px, rows, "white", y0, shoulder + 20)
    if wm:
        m = [p for c in wm for p in c]
        mx0, mx1, my0, my1 = bbox(m)
        print(f"  MASK  u {U(mx0):+.3f}..{U(mx1):+.3f}   w {Wl(my1):+.3f}..{Wl(my0):+.3f}"
              f"   ({len(m)}px, {len(wm)} comps)")
        print("  mask boundary (u -> w_top / w_bot):")
        for k in range(-9, 10):
            u = k / 10.0
            x = int(CX + u * R)
            col = [y for (xx, y) in m if xx == x]
            if col:
                print(f"      u={u:+.2f}   w_top={Wl(min(col)):+.3f}   w_bot={Wl(max(col)):+.3f}")

    # --- beak: largest orange component in the head ------------------------
    ob = pick(px, rows, "orange", y0, shoulder + 20)
    if ob:
        b = ob[0]
        bx0, bx1, by0, by1 = bbox(b)
        print(f"  BEAK  u {U(bx0):+.3f}..{U(bx1):+.3f}   w {Wl(by1):+.3f}..{Wl(by0):+.3f}"
              f"   max half_u {(bx1-bx0)/2/R:.3f}")
        print("  beak half-width by w:")
        for k in range(10):
            y = int(by0 + (by1 - by0) * k / 9)
            xs = [p[0] for p in b if abs(p[1] - y) <= 2]
            if xs:
                print(f"      w={Wl(y):+.3f}   half_u={(max(xs)-min(xs))/2/R:.3f}")

    # --- eyes: two largest iris components inside the mask band ------------
    ir = pick(px, rows, "iris", y0, shoulder)
    ir = [c for c in ir if abs(Wl(bbox(c)[2])) < 0.9][:4]
    eyes = []
    for c in ir:
        ex0, ex1, ey0, ey1 = bbox(c)
        if (ex1 - ex0) < 1.2 * R and (ey1 - ey0) < 1.2 * R:
            eyes.append((sum(p[0] for p in c)/len(c), sum(p[1] for p in c)/len(c),
                         ex1-ex0, ey1-ey0, len(c)))
    eyes.sort(key=lambda e: -e[4])
    eyes = sorted(eyes[:4], key=lambda e: e[0])
    if len(eyes) > 2:
        best, pair = 1e9, None
        for i in range(len(eyes)):
            for j in range(i + 1, len(eyes)):
                d = abs((eyes[i][0] - CX) + (eyes[j][0] - CX))
                if d < best:
                    best, pair = d, [eyes[i], eyes[j]]
        eyes = pair
    for i, (cx, cy, w_, h_, n) in enumerate(eyes[:2]):
        print(f"  IRIS {i}  u={U(cx):+.3f}  w={Wl(cy):+.3f}  dia_u={w_/R:.3f}  ({n}px)")
    if len(eyes) >= 2:
        print(f"  eye separation     {abs(eyes[-1][0]-eyes[0][0])/(2*R):.4f} of head width")

    # --- glasses: dark components enclosed by the mask bbox ----------------
    if wm:
        mx0, mx1, my0, my1 = bbox(wm[0])
        dk = pick(px, rows, "dark", my0, my1 + 10, mx0 - 40, mx1 + 40)
        for i, c in enumerate(dk[:2]):
            gx0, gx1, gy0, gy1 = bbox(c)
            print(f"  FRAME {i}  u {U(gx0):+.3f}..{U(gx1):+.3f}"
                  f"   w {Wl(gy1):+.3f}..{Wl(gy0):+.3f}   ({len(c)}px)")

    # --- lower body --------------------------------------------------------
    feet = pick(px, rows, "orange", int(y0 + 0.80 * TOT), y1)
    if feet:
        fx = [p[0] for c in feet[:2] for p in c]; fy = [p[1] for c in feet[:2] for p in c]
        print(f"  feet               {F(min(fy)):.4f}h .. {F(max(fy)):.4f}h"
              f"   stance {N(max(fx)-min(fx)):.4f}h")
    print("  width profile:")
    print("      " + "  ".join(
        f"{f:.2f}:{N(max(rows[int(y0+f*TOT)])-min(rows[int(y0+f*TOT)])):.3f}"
        for f in [0.40, 0.46, 0.52, 0.58, 0.64, 0.70, 0.76, 0.82, 0.88, 0.94]
        if int(y0 + f * TOT) in rows))
    return R, CY, y0, TOT

def analyse_side():
    px, W, H = load("piku-side-view.png")
    rows = silhouette(px, W, H)
    ys = sorted(rows)
    y0, y1 = ys[0], ys[-1]
    TOT = y1 - y0
    N = lambda v: v / TOT
    F = lambda y: (y - y0) / TOT
    blue = pick(px, rows, "blue", y0, y1)
    shoulder = bbox(blue[0])[2]
    best_y, best_w = None, 0
    for y in range(y0, shoulder):
        r = rows.get(y, [])
        if r and (max(r) - min(r)) > best_w:
            best_w, best_y = max(r) - min(r), y
    print(f"\n=== SIDE ===  figure h={TOT}px   shoulder {F(shoulder):.4f}h")
    print(f"  head depth         {N(best_w):.4f}h  at {F(best_y):.4f}h")
    ob = pick(px, rows, "orange", y0, shoulder + 20)
    headrow = rows[best_y]
    if ob:
        b = ob[0]
        bx0, bx1, by0, by1 = bbox(b)
        # Piku faces -x in this view if the beak reaches past the head's min x
        front = min(headrow) - bx0
        print(f"  beak u-extent      x {bx0}..{bx1}   head row x {min(headrow)}..{max(headrow)}")
        print(f"  beak protrusion    {N(max(0, front)):.4f}h beyond the skull silhouette")
        print(f"  beak w-range       {F(by0):.4f}h .. {F(by1):.4f}h")
    print("  depth profile:")
    print("      " + "  ".join(
        f"{f:.2f}:{N(max(rows[int(y0+f*TOT)])-min(rows[int(y0+f*TOT)])):.3f}"
        for f in [0.06, 0.12, 0.20, 0.28, 0.36, 0.44, 0.52, 0.60, 0.68, 0.76, 0.84, 0.92]
        if int(y0 + f * TOT) in rows))

if __name__ == "__main__":
    analyse_front()
    analyse_side()
