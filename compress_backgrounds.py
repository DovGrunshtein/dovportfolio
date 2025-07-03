from PIL import Image
import os

def compress_image(path, max_width=1920, quality=75):
    img = Image.open(path)
    orig_size = os.path.getsize(path)
    # Resize if needed
    if img.width > max_width:
        ratio = max_width / img.width
        new_height = int(img.height * ratio)
        img = img.resize((max_width, new_height), Image.LANCZOS)
    # Save with compression
    img.save(path, quality=quality, optimize=True)
    new_size = os.path.getsize(path)
    print(f"{os.path.basename(path)}: {orig_size//1024}KB -> {new_size//1024}KB")

if __name__ == "__main__":
    assets = 'assets'
    files = ['Sunset.JPG', '6875.jpg']
    for fname in files:
        fpath = os.path.join(assets, fname)
        if os.path.exists(fpath):
            compress_image(fpath)
        else:
            print(f"File not found: {fpath}") 