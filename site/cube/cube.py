import math
import time
import os

vertices = [
    (x, y, z)
    for x in (-1, 1)
    for y in (-1, 1)
    for z in (-1, 1)
]

edges = [
    (i, j)
    for i in range(8)
    for j in range(i + 1, 8)
    if sum(vertices[i][k] != vertices[j][k] for k in range(3)) == 1
]

W, H = 80, 30


def rotate(x, y, z, a):
    y, z = (
        y * math.cos(a) - z * math.sin(a),
        y * math.sin(a) + z * math.cos(a)
    )
    x, z = (
        x * math.cos(a) + z * math.sin(a),
        -x * math.sin(a) + z * math.cos(a)
    )
    return x, y, z


def project(point):
    x, y, z = point
    scale = 35 / (z + 5)
    return (
        int(W / 2 + x * scale * 2),
        int(H / 2 - y * scale)
    )


def line(screen, x1, y1, x2, y2):
    steps = max(abs(x2 - x1), abs(y2 - y1), 1)
    for i in range(steps + 1):
        t = i / steps
        x = round(x1 + (x2 - x1) * t)
        y = round(y1 + (y2 - y1) * t)
        if 0 <= x < W and 0 <= y < H:
            screen[y][x] = "█"


os.system("clear")
print("\033[?25l", end="")
a = 0

while True:
    screen = [[" " for _ in range(W)] for _ in range(H)]
    points = [project(rotate(*v, a)) for v in vertices]
    for i, j in edges:
        line(screen, *points[i], *points[j])
    print("\033[H", end="")
    print("\n".join("".join(row) for row in screen), end="", flush=True)
    a += 0.035
    time.sleep(0.03)
