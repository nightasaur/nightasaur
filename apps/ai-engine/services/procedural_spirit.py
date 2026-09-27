# SPDX-License-Identifier: MIT
"""Original parameterized creature artwork; no model, external assets or network."""
import base64
import hashlib
import io
import random
from PIL import Image, ImageDraw, ImageFilter

PALETTES = {
    'FIRE': (255, 116, 67), 'WATER': (60, 185, 255),
    'LIGHT': (255, 222, 128), 'SHADOW': (173, 106, 240),
    'STAR': (203, 150, 255), 'ILLUSION': (245, 122, 210),
    'MOON': (183, 213, 250), 'NATURE': (115, 225, 148),
    'THUNDER': (255, 224, 68), 'ICE': (154, 242, 255),
}
STAGES = {'EGG', 'HATCHLING', 'JUVENILE', 'ADULT', 'ULTIMATE', 'LEGENDARY'}
VERSION = 'nightasaur-procedural-v1'


def generate(element: str, stage: str, seed: int) -> dict:
    if element not in PALETTES or stage not in STAGES:
        raise ValueError('Unsupported element or stage')
    rng = random.Random(seed)
    color = PALETTES[element]
    canvas = Image.new('RGB', (512, 512), (13, 18, 37))
    draw = ImageDraw.Draw(canvas)
    for y in range(512):
        draw.line((0, y, 511, y), fill=(13 + y//35, 18 + y//25, 37 + y//22))
    for _ in range(65):
        x, y, r = rng.randrange(512), rng.randrange(410), rng.choice([1, 1, 2])
        draw.ellipse((x-r,y-r,x+r,y+r), fill=(140,165,194))
    glow = Image.new('RGB', canvas.size)
    gd = ImageDraw.Draw(glow)
    gd.ellipse((100,310,430,475), fill=tuple(c//2 for c in color))
    from PIL import ImageChops
    canvas = ImageChops.add(canvas, glow.filter(ImageFilter.GaussianBlur(40)))
    d = ImageDraw.Draw(canvas)
    d.ellipse((99,422,423,456),fill=(12,19,32))
    d.arc((95,415,429,459), 5, 180, fill=color, width=3)
    dark = tuple(int(c*.47) for c in color)
    mid = tuple(int(c*.76) for c in color)
    # Tail and wing silhouettes behind the rounded dinosaur body.
    d.polygon([(295,343),(429,319),(409,276),(451,313),(457,353),(321,398)],fill=dark)
    d.polygon([(303,277),(382,192),(379,272),(429,250),(399,328),(310,341)],fill=mid)
    d.line([(313,316),(382,209),(362,289),(413,265)],fill=color,width=5)
    d.ellipse((152,273,338,429),fill=mid)
    d.ellipse((153,374,228,442),fill=dark)
    d.ellipse((268,382,348,441),fill=dark)
    d.ellipse((174,288,279,420),fill=color)
    # Spine plates, face and independently seeded cheek spots.
    for x,y in [(297,291),(310,316),(319,341)]:
        d.polygon([(x,y-12),(x+26,y-19),(x+13,y+17)],fill=color)
    d.ellipse((128,163,305,320),fill=color)
    d.ellipse((101,229,251,307),fill=color)
    d.polygon([(159,186),(149,129),(194,176)],fill=mid)
    d.polygon([(252,177),(281,128),(286,200)],fill=mid)
    d.ellipse((209,202,249,252),fill=(17,27,44))
    d.ellipse((218,205,231,222),fill=(255,255,243))
    d.ellipse((117,249,129,260),fill=dark)
    d.arc((123,253,214,287),0,150,fill=dark,width=3)
    for _ in range(7):
        x,y=rng.randrange(248,289),rng.randrange(265,296)
        d.ellipse((x,y,x+4,y+4),fill=mid)
    d.ellipse((277,310,314,357),fill=dark)
    if stage == 'EGG':
        d.polygon([(135,350),(162,364),(186,348),(211,372),(239,353),(267,376),(298,351),(325,369),(324,419),(292,447),(174,447),(143,423)],fill=(233,227,211))
        for x,y in [(165,394),(213,414),(270,399),(299,421)]:
            d.ellipse((x,y,x+14,y+19),fill=mid)
    if stage in {'ADULT','ULTIMATE','LEGENDARY'}:
        d.polygon([(180,179),(199,125),(222,170),(242,123),(259,180)], fill=(255,228,141))
    # The element emblem is geometric original artwork, not a copied asset.
    d.ellipse((391,58,459,126),outline=color,width=3)
    d.polygon([(425,65),(447,93),(425,119),(404,93)], fill=color)
    out=io.BytesIO(); canvas.save(out,format='PNG',optimize=True)
    raw=out.getvalue()
    return {'status':'completed','seed':seed,'generator':VERSION,
            'images':[{'url':'data:image/png;base64,'+base64.b64encode(raw).decode(),
                       'sha256':hashlib.sha256(raw).hexdigest(), 'width':512,'height':512}],
            'msg':'Original procedural illustration; no AI model used'}
