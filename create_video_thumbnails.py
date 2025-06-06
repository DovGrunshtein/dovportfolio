import cv2
import os
from pathlib import Path
import numpy as np

def create_video_thumbnail(video_path, output_path, target_width=500, target_height=400):
    try:
        # Open the video file
        video = cv2.VideoCapture(str(video_path))
        
        # Read the first frame
        success, frame = video.read()
        
        if success:
            # Convert BGR to RGB
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Create a black canvas with 5:4 aspect ratio
            canvas = np.zeros((target_height, target_width, 3), dtype=np.uint8)
            
            # Calculate dimensions to maintain aspect ratio
            height, width = frame.shape[:2]
            aspect_ratio = width / height
            
            if aspect_ratio > 1.25:  # If video is wider than 5:4
                new_width = target_width
                new_height = int(new_width / aspect_ratio)
            else:  # If video is taller than 5:4
                new_height = target_height
                new_width = int(new_height * aspect_ratio)
            
            # Resize the frame
            resized = cv2.resize(frame, (new_width, new_height))
            
            # Calculate position to center the resized frame
            x_offset = (target_width - new_width) // 2
            y_offset = (target_height - new_height) // 2
            
            # Place the resized frame on the canvas
            canvas[y_offset:y_offset+new_height, x_offset:x_offset+new_width] = resized
            
            # Save the thumbnail
            cv2.imwrite(str(output_path), cv2.cvtColor(canvas, cv2.COLOR_RGB2BGR))
            print(f"Created thumbnail: {output_path}")
        else:
            print(f"Could not read video: {video_path}")
            
    except Exception as e:
        print(f"Error processing {video_path}: {str(e)}")
    finally:
        if 'video' in locals():
            video.release()

def main():
    # Create thumbnails directory if it doesn't exist
    thumbnails_dir = Path('thumbnails/videos')
    thumbnails_dir.mkdir(parents=True, exist_ok=True)
    
    # Get all video files from the videos directory
    videos_dir = Path('videos')
    video_extensions = {'.mp4', '.mov', '.MP4', '.MOV'}
    
    # Process all videos
    for video_path in videos_dir.rglob('*'):
        if video_path.suffix in video_extensions:
            # Create thumbnail filename
            thumbnail_name = f"{video_path.stem}_thumb.jpg"
            thumbnail_path = thumbnails_dir / thumbnail_name
            
            # Create thumbnail
            create_video_thumbnail(str(video_path), str(thumbnail_path))

if __name__ == '__main__':
    main() 