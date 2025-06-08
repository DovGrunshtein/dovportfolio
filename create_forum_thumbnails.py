from PIL import Image
import os
from pathlib import Path

def create_forum_thumbnail(image_path, output_path, target_width=300, target_height=375):
    try:
        # Open the image
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Create a black canvas with 4:5 aspect ratio
            canvas = Image.new('RGB', (target_width, target_height), 'black')
            
            # Calculate dimensions to maintain aspect ratio
            width, height = img.size
            aspect_ratio = width / height
            
            if aspect_ratio > 0.8:  # If image is wider than 4:5
                new_width = target_width
                new_height = int(new_width / aspect_ratio)
            else:  # If image is taller than 4:5
                new_height = target_height
                new_width = int(new_height * aspect_ratio)
            
            # Resize the image
            resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Calculate position to center the resized image
            x_offset = (target_width - new_width) // 2
            y_offset = (target_height - new_height) // 2
            
            # Paste the resized image onto the canvas
            canvas.paste(resized, (x_offset, y_offset))
            
            # Save the thumbnail
            canvas.save(output_path, 'JPEG', quality=85)
            print(f"Created thumbnail: {output_path}")
            
    except Exception as e:
        print(f"Error processing {image_path}: {str(e)}")

def main():
    # Create thumbnails directory if it doesn't exist
    thumbnails_dir = Path('thumbnails/forum')
    thumbnails_dir.mkdir(parents=True, exist_ok=True)
    
    # Get all image files from the forum directory
    forum_dir = Path('forum')
    image_extensions = {'.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'}
    
    # Process all images
    for image_path in forum_dir.rglob('*'):
        if image_path.suffix in image_extensions:
            # Create thumbnail filename
            thumbnail_name = f"{image_path.stem}_thumb.jpg"
            thumbnail_path = thumbnails_dir / thumbnail_name
            
            # Create thumbnail
            create_forum_thumbnail(str(image_path), str(thumbnail_path))

if __name__ == '__main__':
    main() 