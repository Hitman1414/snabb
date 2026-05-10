import sys
try:
    from PIL import Image
except ImportError:
    print("Pillow not installed. Please install it using pip install Pillow.")
    sys.exit(1)
import os
import glob

def process_icon(filepath):
    try:
        img = Image.open(filepath).convert("RGBA")
        datas = img.getdata()
        new_data = []
        
        for item in datas:
            r, g, b, a = item
            # Calculate luminance
            lum = 0.299*r + 0.587*g + 0.114*b
            # Invert luminance for alpha: white/orange becomes transparent, black stays opaque
            alpha = int(255 - lum)
            # Clip alpha to 0-255 just in case
            alpha = max(0, min(255, alpha))
            
            # The line art should be pure white or pure black? Let's make it white, so it stands out on colored backgrounds!
            # Wait, the user's web app had black lines on colored backgrounds (due to hue-rotate).
            # But the user also has a dark mode app where white lines would look better!
            # Let's make them black lines for now to match the generated images.
            new_data.append((0, 0, 0, alpha))
            
        img.putdata(new_data)
        img.save(filepath, "PNG")
        print("Processed:", filepath)
    except Exception as e:
        print("Error processing", filepath, e)

mobile_path = r"h:\Claude Workspace\Major Project\snabb\mobile\assets\category-icons\*.png"
web_path = r"h:\Claude Workspace\Major Project\snabb\web\public\category-icons\*.png"

for f in glob.glob(mobile_path):
    process_icon(f)

for f in glob.glob(web_path):
    process_icon(f)

print("Done processing icons.")
