# Remove light background: flood-fill from edges, edge-connected light pixels -> transparent.
import sys
from collections import deque
from PIL import Image

def transparentize(path, thresh=200):
    img = Image.open(path).convert("RGBA")
    px = img.load()
    w, h = img.size

    def is_bg(x, y):
        r, g, b, a = px[x, y]
        return a == 0 or (r > thresh and g > thresh and b > thresh and
                          abs(r - g) < 18 and abs(g - b) < 18 and abs(r - b) < 18)

    seen = [[False] * h for _ in range(w)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(x, y) and not seen[x][y]:
                seen[x][y] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(x, y) and not seen[x][y]:
                seen[x][y] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        px[x, y] = (255, 255, 255, 0)
        for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[nx][ny] and is_bg(nx, ny):
                seen[nx][ny] = True
                q.append((nx, ny))

    img.save(path, "PNG")
    print(f"done: {path}")

for p in sys.argv[1:]:
    transparentize(p)
