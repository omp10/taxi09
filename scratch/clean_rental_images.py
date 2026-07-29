# Flatten grey studio background + drop shadow to pure white, then auto-crop.
# Cards render on white, so an opaque white background is invisible -- and unlike
# alpha keying this can never eat a white car body.
import sys
from PIL import Image

def clean(src, dst, thresh=206, pad=8):
    im = Image.open(src).convert("RGBA")
    flat = Image.new("RGB", im.size, (255, 255, 255))
    flat.paste(im, mask=im.split()[3])
    px = flat.load()
    w, h = flat.size

    for x in range(w):
        for y in range(h):
            r, g, b = px[x, y]
            if r > thresh and abs(r - g) < 16 and abs(g - b) < 16 and abs(r - b) < 16:
                px[x, y] = (255, 255, 255)

    # auto-crop to the non-white subject
    inv = flat.convert("L").point(lambda v: 0 if v > 250 else 255)
    box = inv.getbbox()
    if box:
        l, t, r_, b_ = box
        box = (max(0, l - pad), max(0, t - pad), min(w, r_ + pad), min(h, b_ + pad))
        flat = flat.crop(box)

    flat.save(dst, "PNG")
    print(f"{dst}: {flat.size}")

if __name__ == "__main__":
    clean(sys.argv[1], sys.argv[2])
