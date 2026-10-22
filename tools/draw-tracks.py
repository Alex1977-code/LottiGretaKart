# Zeichnet die Strecken-Umrisse aus tests/out/track-*.json als PNG (Fahrbahn grau, Banden rot, Start schwarz).
import json, glob, math, sys
from PIL import Image, ImageDraw
for f in glob.glob('tests/out/track-*.json'):
    d = json.load(open(f))
    pts = d['pts']
    xs = [p[0] for p in pts]; zs = [p[1] for p in pts]
    minx, maxx, minz, maxz = min(xs) - 25, max(xs) + 25, min(zs) - 25, max(zs) + 25
    S = 900 / max(maxx - minx, maxz - minz)
    W, H = int((maxx - minx) * S), int((maxz - minz) * S)
    im = Image.new('RGB', (W, H), (120, 200, 90)); dr = ImageDraw.Draw(im)
    m = lambda x, z: ((x - minx) * S, (z - minz) * S)
    N = len(pts)
    def side(k, lat):
        i = k % N; j = (i + 1) % N; ii = (i - 1) % N
        tx = pts[j][0] - pts[ii][0]; tz = pts[j][1] - pts[ii][1]; l = math.hypot(tx, tz) or 1
        tx /= l; tz /= l
        return m(pts[i][0] - tz * lat, pts[i][1] + tx * lat)
    for k in range(N):
        hw, wall = pts[k][2], pts[k][3]
        poly = [side(k, -hw), side(k + 1, -hw), side(k + 1, hw), side(k, hw)]
        dr.polygon(poly, fill=(150, 145, 165))
    for s in (-1, 1):
        line = [side(k, s * pts[k % N][3]) for k in range(N + 1)]
        dr.line(line, fill=(220, 40, 40), width=2)
    for k in range(0, N, 50):
        dr.text(side(k, 0), f"{k/N:.2f}", fill=(0, 0, 0))
    a, b = side(0, -pts[0][2]), side(0, pts[0][2]); dr.line([a, b], fill=(0, 0, 0), width=4)
    # Fahrtrichtung
    dr.line([side(5, 0), side(15, 0)], fill=(255, 255, 0), width=4)
    out = f.replace('.json', '.png'); im.save(out); print(out)
