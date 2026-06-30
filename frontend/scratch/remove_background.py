import os
from PIL import Image

def remove_checkered_background(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path)
    # Convert to RGBA
    img = img.convert("RGBA")
    width, height = img.size
    
    # Visited set for flood fill
    visited = set()
    
    # Load pixel data
    pixels = img.load()
    
    # Queue for BFS flood fill
    queue = []
    
    # Add all boundary pixels as seeds
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(1, height - 1):
        queue.append((0, y))
        queue.append((width - 1, y))
        
    # Helper to check if a pixel color is background-like
    # Checkerboard is usually white (255, 255, 255) and light gray (~180-254)
    # Both are high-brightness near-neutral grays.
    def is_bg(r, g, b):
        # High brightness gray/white
        min_val = min(r, g, b)
        max_val = max(r, g, b)
        is_neutral = (max_val - min_val) <= 20
        is_bright = min_val > 150
        return is_neutral and is_bright

    # BFS Flood Fill
    while queue:
        x, y = queue.pop(0)
        if (x, y) in visited:
            continue
        visited.add((x, y))
        
        r, g, b, a = pixels[x, y]
        
        if is_bg(r, g, b):
            # Make this pixel fully transparent
            pixels[x, y] = (0, 0, 0, 0)
            
            # Add 4-connected neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        queue.append((nx, ny))

    # Save output image
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

# Run for swift image
image_dir = r"z:\projects\taxi09\frontend\src\assets\images"
swift_in = os.path.join(image_dir, "maruti_swift_nobg.png")
swift_out = os.path.join(image_dir, "maruti_swift_transparent.png")
remove_checkered_background(swift_in, swift_out)

# Run for rental car image (blue SUV) to remove its white background too!
rental_in = os.path.join(image_dir, "rental_car.png")
rental_out = os.path.join(image_dir, "rental_car_transparent.png")
remove_checkered_background(rental_in, rental_out)
