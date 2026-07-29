#!/usr/bin/env python3
"""Generate PNG app icons from the Classroom Command Center design spec."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

BG_TOP = (12, 74, 110)
BG_MID = (3, 105, 161)
BG_BOTTOM = (14, 116, 144)
SCREEN_TOP = (240, 249, 255)
SCREEN_BOTTOM = (186, 230, 253)
ACCENT_CYAN = (34, 211, 238)
ACCENT_GREEN = (52, 211, 153)
ACCENT_GOLD = (251, 191, 36)


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def gradient_bg(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size))
    draw = ImageDraw.Draw(img)
    for y in range(size):
        t = y / max(size - 1, 1)
        if t < 0.55:
            local = t / 0.55
            color = tuple(lerp(BG_TOP[i], BG_MID[i], local) for i in range(3))
        else:
            local = (t - 0.55) / 0.45
            color = tuple(lerp(BG_MID[i], BG_BOTTOM[i], local) for i in range(3))
        draw.line([(0, y), (size, y)], fill=color + (255,))
    return img


def rounded_rect(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    radius: int,
    fill: tuple[int, ...],
) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def draw_icon(size: int) -> Image.Image:
    scale = size / 512
    img = gradient_bg(size)
    draw = ImageDraw.Draw(img)

    corner = int(96 * scale)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=corner, fill=255)
    img.putalpha(mask)

    screen = (
        int(108 * scale),
        int(108 * scale),
        int(404 * scale),
        int(304 * scale),
    )
    rounded_rect(draw, screen, int(20 * scale), SCREEN_TOP)

    draw.rounded_rectangle(
        (
            int(140 * scale),
            int(144 * scale),
            int(252 * scale),
            int(158 * scale),
        ),
        radius=int(7 * scale),
        fill=BG_MID,
    )
    for idx, (y, width, alpha) in enumerate(
        (
            (172, 232, 255),
            (194, 176, 191),
            (216, 128, 140),
        )
    ):
        color = tuple(int(125 + (186 - 125) * (alpha / 255)) for _ in range(3)) + (alpha,)
        draw.rounded_rectangle(
            (
                int(140 * scale),
                int(y * scale),
                int((140 + width) * scale),
                int((y + 10) * scale),
            ),
            radius=int(5 * scale),
            fill=color,
        )

    for cx, color in (
        (332, ACCENT_CYAN),
        (276, ACCENT_GREEN),
        (220, ACCENT_GOLD),
    ):
        r = int(18 * scale)
        draw.ellipse(
            (
                int((cx - 18) * scale),
                int((252 - 18) * scale),
                int((cx + 18) * scale),
                int((252 + 18) * scale),
            ),
            fill=color,
        )

    draw.rounded_rectangle(
        (
            int(244 * scale),
            int(304 * scale),
            int(268 * scale),
            int(356 * scale),
        ),
        radius=int(8 * scale),
        fill=(100, 116, 139),
    )
    draw.rounded_rectangle(
        (
            int(176 * scale),
            int(352 * scale),
            int(336 * scale),
            int(370 * scale),
        ),
        radius=int(9 * scale),
        fill=(71, 85, 105),
    )
    draw.rounded_rectangle(
        (
            int(216 * scale),
            int(370 * scale),
            int(296 * scale),
            int(380 * scale),
        ),
        radius=int(5 * scale),
        fill=(51, 65, 85),
    )
    return img


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for name, size in (
        ("icon-192.png", 192),
        ("icon-512.png", 512),
        ("apple-touch-icon.png", 180),
    ):
        draw_icon(size).save(PUBLIC / name, format="PNG", optimize=True)
        print(f"wrote {PUBLIC / name}")


if __name__ == "__main__":
    main()
