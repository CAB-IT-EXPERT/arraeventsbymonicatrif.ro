"""Prepare local website assets; original supplied media is preserved."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import json
import subprocess
import sys
import tempfile
import shutil

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(tempfile.gettempdir()) / 'codex-gallery-dl'))
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
ASSETS = ROOT / 'assets'
for name in ['images', 'video', 'posters', 'fonts', 'icons']:
    (ASSETS / name).mkdir(parents=True, exist_ok=True)

photos = []
for source in sorted((ROOT / 'media_website_selectie' / 'poze').glob('*.jpg')):
    number = source.name[:2]
    with Image.open(source) as original:
        im = ImageOps.exif_transpose(original).convert('RGB')
        photos.append({'id': number, 'source': source.name, 'width': im.width, 'height': im.height})
        for width in [480, 900, 1440]:
            resized = im.copy()
            resized.thumbnail((width, 2400), Image.Resampling.LANCZOS)
            resized.save(ASSETS / 'images' / f'photo-{number}-{width}.webp', quality=85, method=6)

logo_source = Path(r'C:\Users\Alexie\AppData\Local\Temp\codex-clipboard-183263a0-daa6-4744-a907-4135bdaa8d40.png')
with Image.open(logo_source) as im:
    im = im.convert('RGB')
    im.thumbnail((500, 500), Image.Resampling.LANCZOS)
    im.save(ASSETS / 'images' / 'arra-logo.webp', quality=92, method=6)

videos = []
qa = ROOT / 'qa'
qa.mkdir(exist_ok=True)
for source in sorted((ROOT / 'media_website_selectie' / 'video').glob('*.mp4')):
    dest = ASSETS / 'video' / source.name
    panoramic = source.stem.endswith('DTfQlqzgg9I')
    encoding = (['-vf', 'crop=1280:576:0:72', '-c:v', 'libx264', '-preset', 'slow',
                 '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'copy'] if panoramic else ['-c', 'copy'])
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
                    *encoding, '-movflags', '+faststart', str(dest)], check=True)
    reader = imageio_ffmpeg.read_frames(str(dest))
    meta = next(reader)
    reader.close()
    code = source.stem.split('_', 1)[1]
    poster = ASSETS / 'posters' / f'{code}.webp'
    duration = meta['duration']
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(min(2, duration / 4)),
                    '-i', str(dest), '-frames:v', '1', '-vf', 'scale=640:-1', '-quality', '87', str(poster)], check=True)
    videos.append({'source': source.name, 'code': code, 'width': meta['size'][0],
                   'height': meta['size'][1], 'duration': duration, 'bytes': dest.stat().st_size})
    if code in ['DcbaYvDiBdO', 'DcibFTkCu5D']:
        frames = []
        for i, ratio in enumerate([.12, .4, .7, .9]):
            frame = qa / f'{code}-{i}.jpg'
            subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(duration * ratio),
                            '-i', str(dest), '-frames:v', '1', '-vf', 'scale=360:-1', str(frame)], check=True)
            frames.append(frame)
        sheet = Image.new('RGB', (1440, 680), '#f7f0e6')
        for i, frame in enumerate(frames):
            with Image.open(frame) as image:
                image.thumbnail((350, 640))
                sheet.paste(image, (i * 360, 0))
            ImageDraw.Draw(sheet).text((i * 360 + 10, 650), f'{round(duration * [.12,.4,.7,.9][i],1)} sec', fill='black')
        sheet.save(qa / f'{code}-contact.jpg', quality=90)

(qa / 'media-inventory.json').write_text(json.dumps({'photos': photos, 'videos': videos}, ensure_ascii=False, indent=2), encoding='utf-8')
sheet = Image.new('RGB', (6 * 220, 2 * 400), '#f7f0e6')
for i, video in enumerate(videos):
    with Image.open(ASSETS / 'posters' / f'{video["code"]}.webp') as im:
        im.thumbnail((210, 365))
        sheet.paste(im, ((i % 6) * 220, (i // 6) * 400))
    ImageDraw.Draw(sheet).text(((i % 6) * 220, (i // 6) * 400 + 371), video['code'], fill='black')
sheet.save(qa / 'videos-contact.jpg', quality=90)
print(json.dumps({'photos': len(photos), 'videos': videos}, indent=2))
