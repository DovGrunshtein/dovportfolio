from PIL import Image
import os
from pathlib import Path

def create_thumbnail(image_path, output_path, size=(300, 300)):
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Calculate new dimensions while maintaining aspect ratio
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Save the thumbnail
            img.save(output_path, 'JPEG', quality=85)
            print(f"Created thumbnail: {output_path}")
    except Exception as e:
        print(f"Error processing {image_path}: {str(e)}")

def main():
    # Create thumbnails directory if it doesn't exist
    thumbnails_dir = Path('thumbnails')
    thumbnails_dir.mkdir(exist_ok=True)
    
    # Get all image files from the images directory
    images_dir = Path('images')
    image_extensions = {'.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'}
    
    # Process all images
    for image_path in images_dir.rglob('*'):
        if image_path.suffix in image_extensions:
            # Create thumbnail filename
            thumbnail_name = f"{image_path.stem}_thumb{image_path.suffix}"
            thumbnail_path = thumbnails_dir / thumbnail_name
            
            # Create thumbnail
            create_thumbnail(str(image_path), str(thumbnail_path))

if __name__ == '__main__':
    main() 