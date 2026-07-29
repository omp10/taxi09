# Pass 2: remove the soft grey floor shadow left behind by transparentize.py.
# Seeds from existing transparent pixels, only eats neutral-grey pixels in the
# lower part of the image, so light car bodywork higher up is never touched.
import sys
from collections import deque
from PIL import Image

def drop_shadow(path, thresh=150, bottom_frac=0.30):
    img = Image.open(path).convert("RGBA")
    px = img.load()
    w, h = img.size
    y0 = int(h * (1 - bottom_frac))

    def is_shadow(x, y):
        r, g, b, a = px[x, y]
        if a == 0:
            return True
        return (r > thresh and abs(r - g) < 14 and abs(g - b) < 14 and abs(r - b) < 14)

    seen = [[False] * h for _ in range(w)]
    q = deque()
    for x in range(w):
        for y in range(y0, h):
            if px[x, y][3] == 0 and not seen[x][y]:
                seen[x][y] = True
                q.append((x, y))

    cleared = 0
    while q:
        x, y = q.popleft()
        if px[x, y][3] != 0:
            px[x, y] = (255, 255, 255, 0)
            cleared += 1
        for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if 0 <= nx < w and y0 <= ny < h and not seen[nx][ny] and is_shadow(nx, ny):
                seen[nx][ny] = True
                q.append((nx, ny))

    img.save(path, "PNG")
    print(f"done: {path} (cleared {cleared}px)")

for p in sys.argv[1:]:
    drop_shadow(p)
