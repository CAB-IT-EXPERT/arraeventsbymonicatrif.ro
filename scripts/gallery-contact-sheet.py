"""Local visual index for selecting the client's existing photos; not a website asset."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import sys
import math

root = Path(__file__).resolve().parents[1]
instagram = '--instagram' in sys.argv
photos = sorted((root / 'instagram_arra_eventplanner').glob('*.jpg')) if instagram else sorted((root / 'assets/images').glob('photo-*-480.webp'))
bundle = Path(sys.argv[sys.argv.index('--bundle') + 1]) if '--bundle' in sys.argv else None
if bundle:
    photos = [p for p in sorted(bundle.iterdir()) if p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp', '.heic')]
sheet = Image.new('RGB', (6 * 200, math.ceil(len(photos) / 6) * 236), '#ffffff')
draw = ImageDraw.Draw(sheet)
for i, photo in enumerate(photos):
    with Image.open(photo) as image:
        thumb = ImageOps.contain(image, (188, 204))
        x, y = (i % 6) * 200 + 6, (i // 6) * 236 + 4
        sheet.paste(thumb, (x, y))
        draw.text((x, y + 210), f'{i:02} {photo.name[:19]}' if bundle else photo.stem[11:] if instagram else photo.name.split('-')[1], fill='#333333')
sheet.save(root / ('qa/instagram-bundle-sheet.jpg' if bundle else 'qa/instagram-contact-sheet.jpg' if instagram else 'qa/gallery-contact-sheet.jpg'), quality=90)
