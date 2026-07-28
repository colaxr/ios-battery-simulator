from collections import deque
from pathlib import Path

from PIL import Image
from PIL import ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


def black_to_alpha(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, _ = pixels[x, y]
            light = max(r, g, b)
            alpha = max(0, min(255, (light - 10) * 7))
            pixels[x, y] = (r, g, b, alpha)
    return image


def remove_connected_white_and_invert(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    width, height = image.size
    source = image.load()
    background = set()
    queue = deque()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in background:
            continue
        r, g, b, _ = source[x, y]
        if min(r, g, b) < 205:
            continue
        background.add((x, y))
        if x:
            queue.append((x - 1, y))
        if x + 1 < width:
            queue.append((x + 1, y))
        if y:
            queue.append((x, y - 1))
        if y + 1 < height:
            queue.append((x, y + 1))

    output = Image.new("RGBA", image.size, (0, 0, 0, 0))
    target = output.load()
    for y in range(height):
        for x in range(width):
            if (x, y) in background:
                continue
            r, g, b, _ = source[x, y]
            target[x, y] = (255 - r, 255 - g, 255 - b, 255)
    return output


def remove_connected_background(image: Image.Image, tolerance: int = 38) -> Image.Image:
    image = image.convert("RGBA")
    width, height = image.size
    source = image.load()
    sample = source[0, 0][:3]
    background = set()
    queue = deque([(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)])

    while queue:
        x, y = queue.popleft()
        if (x, y) in background:
            continue
        r, g, b, _ = source[x, y]
        if max(abs(r - sample[0]), abs(g - sample[1]), abs(b - sample[2])) > tolerance:
            continue
        background.add((x, y))
        if x:
            queue.append((x - 1, y))
        if x + 1 < width:
            queue.append((x + 1, y))
        if y:
            queue.append((x, y - 1))
        if y + 1 < height:
            queue.append((x, y + 1))

    output = image.copy()
    pixels = output.load()
    for x, y in background:
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
    return output


final_reference = Image.open(PUBLIC / "ios-screen-time-reference.jpg")
battery_low = final_reference.crop((526, 19, 571, 50))

normal_reference = Image.open(PUBLIC / "ref-ios17.png")
wifi_source = normal_reference.crop((916, 54, 994, 124))
wifi_full = remove_connected_white_and_invert(wifi_source).resize((39, 35), Image.Resampling.LANCZOS)
wifi_full.save(PUBLIC / "ios17-wifi-full.png")

for name, fade_until in (("medium", 15), ("weak", 23)):
    variant = wifi_full.copy()
    pixels = variant.load()
    for y in range(variant.height):
        for x in range(variant.width):
            r, g, b, alpha = pixels[x, y]
            if y < fade_until:
                pixels[x, y] = (r, g, b, round(alpha * 0.22))
    variant.save(PUBLIC / f"ios17-wifi-{name}.png")

battery_low_asset = black_to_alpha(battery_low)
battery_low_asset.save(PUBLIC / "ios17-battery-low.png")

battery_normal = normal_reference.crop((992, 56, 1092, 122))
normal_asset_retina = remove_connected_white_and_invert(battery_normal)
normal_asset = normal_asset_retina.resize((50, 33), Image.Resampling.LANCZOS)
normal_asset.save(PUBLIC / "ios17-battery-normal.png")

vector_preview = Image.open(PUBLIC / "ios17-statusbar-reference.webp")
vector_battery = vector_preview.crop((692, 244, 752, 286))
vector_shape = remove_connected_background(vector_battery)
vector_shape.save(PUBLIC / "ios17-battery-shape.png")

battery_dir = PUBLIC / "battery"
battery_dir.mkdir(exist_ok=True)
render_scale = 4
font = ImageFont.truetype(
    ROOT / "assets" / "fonts" / "SF-Pro-Text-Semibold.otf",
    17 * render_scale,
)

# Use the exact battery silhouette from the user's final 591 px reference.
# Restore the enclosed digit holes to obtain a solid body mask, while keeping
# the original JPEG edge coverage and the separate native terminal.
source_alpha = battery_low_asset.getchannel("A")
solid_alpha = Image.new("L", battery_low_asset.size, 0)
source_pixels = source_alpha.load()
solid_pixels = solid_alpha.load()
body_limit = 38
for y in range(6, 26):
    row = [x for x in range(body_limit) if source_pixels[x, y] >= 128]
    if row:
        for x in range(min(row), max(row) + 1):
            solid_pixels[x, y] = 255
    for x in range(body_limit, source_alpha.width):
        if source_pixels[x, y] >= 96:
            solid_pixels[x, y] = 255

render_size = (
    battery_low_asset.width * render_scale,
    battery_low_asset.height * render_scale,
)
shape_alpha = solid_alpha.resize(render_size, Image.Resampling.LANCZOS)
body_left, body_right = 2 * render_scale, 38 * render_scale
body_top, body_bottom = 6 * render_scale, 27 * render_scale

for mode in ("normal", "low"):
    for percent in range(1, 101):
        icon = Image.new("RGBA", render_size, (0, 0, 0, 0))
        pixels = icon.load()
        alpha = shape_alpha.load()
        fill_right = body_left + round((body_right - body_left) * percent / 100)

        for y in range(icon.height):
            for x in range(icon.width):
                a = alpha[x, y]
                if not a:
                    continue
                if x >= body_right:
                    color = (128, 128, 131)
                elif x <= fill_right:
                    color = (255, 214, 10) if mode == "low" else (242, 242, 247)
                else:
                    color = (128, 128, 131)
                pixels[x, y] = (*color, a)

        text = str(percent)
        text_mask = Image.new("L", render_size, 0)
        draw = ImageDraw.Draw(text_mask)
        box = draw.textbbox((0, 0), text, font=font, stroke_width=0)
        text_width = box[2] - box[0]
        text_height = box[3] - box[1]
        text_x = round((body_left + body_right - text_width) / 2)
        text_y = round((body_top + body_bottom - text_height) / 2) - box[1]
        draw.text((text_x, text_y), text, fill=255, font=font)
        text_pixels = text_mask.load()

        for y in range(icon.height):
            for x in range(icon.width):
                coverage = text_pixels[x, y]
                if not coverage or not alpha[x, y]:
                    continue
                text_color = (20, 20, 22)
                pixels[x, y] = (*text_color, min(alpha[x, y], coverage))

        icon.resize(battery_low_asset.size, Image.Resampling.LANCZOS).save(
            battery_dir / f"{mode}-{percent}.png",
            optimize=True,
        )
