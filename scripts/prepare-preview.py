"""Non-destructive, local-only derivatives for the champagne/pastel redesign."""
from pathlib import Path
import argparse
import subprocess
import json
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--hero', type=Path)
parser.add_argument('--videos', action='store_true')
parser.add_argument('--client-photos', action='store_true')
args = parser.parse_args()
images = root / 'assets/images'

def webp(source, target, width, quality=84):
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original)
        image.thumbnail((width, width * 3), Image.Resampling.LANCZOS)
        image.save(target, quality=quality, method=6)
        print(f'{target.relative_to(root)}: {image.width}x{image.height}, {target.stat().st_size:,} bytes')

if args.hero:
    for width in (640, 1200):
        webp(args.hero, images / f'hero-pastel-{width}.webp', width, 86)

if args.client_photos:
    for number, uid, *_ in json.loads((root / 'scripts/client-photos.json').read_text(encoding='utf-8')):
        source = Path('C:/Users/Alexie/AppData/Local/Temp') / f'codex-clipboard-{uid}.png'
        for width in (480, 900, 1440):
            target = images / f'photo-client{number:02}-{width}.webp'
            if not target.exists():
                webp(source, target, width, 88)

selection = [
    '2026-07-26_DbQ6dDuiQVu_01.jpg',
    '2026-07-04_DaZkX7vCALG_01.jpg',
    '2026-07-17_Da5TO34ggDr_01.jpg',
    '2026-09-02_DczKS6mgoSs_02.jpg',
    '2026-07-17_Da5TO34ggDr_02.jpg',
    '2026-09-02_DczKS6mgoSs_01.jpg',
]
for index, filename in enumerate(selection, 1):
    for width in (480, 900, 1440):
        webp(root / 'instagram_arra_eventplanner' / filename,
             images / f'photo-ig{index:02}-{width}.webp', width)
webp(root / 'assets/icons/cab-it-logo.png', root / 'assets/icons/cab-it-logo-small.webp', 96)

if args.videos:
    ffmpeg = Path('C:/Users/Alexie/AppData/Local/Temp/codex-gallery-dl/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe')
    output = root / 'assets/previews'
    output.mkdir(exist_ok=True)
    for source in sorted((root / 'assets/video').glob('*.mp4')):
        target = output / source.name
        if target.exists():
            continue
        subprocess.run([str(ffmpeg), '-v', 'error', '-i', str(source), '-vf',
                        "scale='if(gt(iw,ih),640,-2)':'if(gt(iw,ih),-2,640)',fps=20",
                        '-c:v', 'libx264', '-preset', 'fast', '-crf', '27',
                        '-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart',
                        str(target)], check=True)
        print(f'{source.name}: {source.stat().st_size:,} -> {target.stat().st_size:,}', flush=True)
