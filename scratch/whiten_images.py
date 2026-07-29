import os
from PIL import Image

def whiten_image(image_path):
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        return
        
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
            
            # Check if the pixel is near-white or neutral light-grey
            # We check if R, G, B are all bright (> 218)
            # Or if they are very close to each other (neutral shade) and relatively bright (> 195)
            is_light_bg = (r > 215 and g > 215 and b > 215)
            is_neutral_grey = (r > 195 and abs(r - g) < 10 and abs(g - b) < 10 and abs(r - b) < 10)
            
            if is_light_bg or is_neutral_grey:
                pixels[x, y] = (255, 255, 255, 255)

    img.save(image_path, "PNG")
    print(f"✅ Successfully whitened background for: {os.path.basename(image_path)}")

def main():
    assets_dir = r"d:\projects\taxi09\frontend\src\assets\images"
    whiten_image(os.path.join(assets_dir, "rental_car_yellow.png"))
    whiten_image(os.path.join(assets_dir, "driver_beside_cab_white.png"))
    whiten_image(os.path.join(assets_dir, "yellow_sports_bike_transparent.png"))

if __name__ == "__main__":
    main()
