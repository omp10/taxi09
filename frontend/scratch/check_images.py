import os
from PIL import Image

image_dir = r"z:\projects\taxi09\frontend\src\assets\realistic"
files = ["rental.png", "bike.png", "bus.png", "parcel.png", "pooling.png"]

for file in files:
    path = os.path.join(image_dir, file)
    if not os.path.exists(path):
        continue
    img = Image.open(path)
    print(f"\n--- {file} ---")
    print(f"Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
    if img.mode == 'RGBA':
        # check corners
        corners = [
            img.getpixel((0, 0)),
            img.getpixel((img.width - 1, 0)),
            img.getpixel((0, img.height - 1)),
            img.getpixel((img.width - 1, img.height - 1))
        ]
        print(f"Corners: {corners}")
