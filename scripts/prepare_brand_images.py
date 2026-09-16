"""Encode generated artwork as WebP without cropping, resizing or retouching."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
generated = Path(r'C:\Users\Alexie\.codex\generated_images\01a0aa58-8f53-7d92-9da0-4d50377fdaa8')
sources = [
    ('exec-dfc33c1b-d7c2-4b9d-a641-5bd874b89ae3.png', 'hero-editorial.webp'),
    ('exec-ae747c09-dfbf-41b7-b7cd-6aaeb4f429c1.png', 'motto-floral.webp'),
]
for filename, output in sources:
    with Image.open(generated / filename) as image:
        image.save(root / 'assets' / 'images' / output, quality=95, method=6)
        print(output, image.size, image.mode, 'alpha:', image.getchannel('A').getextrema() if 'A' in image.getbands() else 'none')
