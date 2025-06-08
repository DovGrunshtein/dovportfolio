import os
import shutil
from pathlib import Path
import re

def move_thumbnails():
    # Create thumbnails/images directory if it doesn't exist
    thumbnails_dir = Path('thumbnails/images')
    thumbnails_dir.mkdir(parents=True, exist_ok=True)
    
    # Get all image files from the pictures directory
    pictures_dir = Path('pictures')
    image_extensions = {'.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'}
    
    # Process all images
    for image_path in pictures_dir.rglob('*'):
        if image_path.suffix in image_extensions:
            # Create thumbnail filename
            thumbnail_name = f"{image_path.stem}_thumb.jpg"
            thumbnail_path = thumbnails_dir / thumbnail_name
            
            # Copy the image to thumbnails directory
            shutil.copy2(str(image_path), str(thumbnail_path))
            print(f"Created thumbnail: {thumbnail_path}")

def update_html_paths():
    # Read the HTML file
    with open('pictures.html', 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Update image paths
    # Find all img src attributes that point to pictures directory
    pattern = r'src="pictures/([^"]+)"'
    
    def replace_path(match):
        old_path = match.group(1)
        # Get the filename without extension
        filename = os.path.splitext(old_path)[0]
        # Create new path
        new_path = f'thumbnails/images/{filename}_thumb.jpg'
        return f'src="{new_path}"'
    
    # Replace all paths
    new_content = re.sub(pattern, replace_path, content)
    
    # Write the updated content back to the file
    with open('pictures.html', 'w', encoding='utf-8') as file:
        file.write(new_content)
    
    print("Updated HTML paths")

def main():
    move_thumbnails()
    update_html_paths()

if __name__ == '__main__':
    main() 