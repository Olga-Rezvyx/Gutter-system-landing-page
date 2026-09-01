#!/usr/bin/env python3
"""Кадры-заглушки для скролл-героя «Слои стали».

Настоящие кадры генерятся через Higgsfield из фотографии заказчика (см.
docs/hero-plan.md). Пока их нет, этот скрипт рисует схематичную разборку
среза кромки жёлоба, чтобы движок промотки, привязка текста к кадрам и
вёрстка проверялись целиком, а не на пустом канвасе.

Каждый кадр помечен словом ЗАГЛУШКА — так его нельзя случайно принять за
готовый материал и показать заказчику.

    python3 tools/make_placeholder_frames.py

Пишет assets/frames/f0000.jpg … и manifest.json рядом.
"""

import json
import os

from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 720
FRAMES = 240
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "assets", "frames")

# Порядок сверху вниз, как в реальном срезе. Толщины намеренно не подписаны:
# они берутся из спецификации заказчика, а не выдумываются здесь.
LAYERS = [
    ("Защитный полимер", (196, 176, 140)),
    ("Грунт",            (150, 138, 120)),
    ("Пассивация",       (120, 128, 136)),
    ("Цинк",             (176, 184, 192)),
    ("Сталь",            (208, 212, 216)),
    ("Цинк (обратная)",  (176, 184, 192)),
    ("Защитный лак",     (140, 132, 120)),
]

BAR_W = 620
BAR_H = 16
GAP_CLOSED = 2      # собранный срез: слои прижаты друг к другу
GAP_OPEN = 74       # полностью разобранный


def font(size):
    for path in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                 "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"):
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def ease(t):
    """Та же smoothstep, что и в движке, чтобы разборка шла в его темпе."""
    return t * t * (3 - 2 * t)


def render(i):
    p = ease(i / (FRAMES - 1))
    gap = GAP_CLOSED + (GAP_OPEN - GAP_CLOSED) * p

    img = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(img)

    span = len(LAYERS) * BAR_H + (len(LAYERS) - 1) * gap
    y = (H - span) / 2
    x0 = (W - BAR_W) / 2

    for _name, colour in LAYERS:
        d.rectangle([x0, y, x0 + BAR_W, y + BAR_H], fill=colour)
        y += BAR_H + gap

    # Подписи слоёв рисует страница, а не кадр: на кадре они дублировались бы
    # с колонкой текста и поехали бы при первой же правке текста.
    d.text((W / 2, H - 40), "ЗАГЛУШКА — не итоговый материал",
           font=font(15), fill=(90, 90, 90), anchor="ms")
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    for i in range(FRAMES):
        render(i).save(os.path.join(OUT, f"f{i:04d}.jpg"), quality=82, optimize=True)

    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump({"frames": FRAMES, "pattern": "f%04d.jpg",
                   "width": W, "height": H, "placeholder": True}, f, indent=2)
    print(f"{FRAMES} кадров-заглушек в {OUT}")


if __name__ == "__main__":
    main()
