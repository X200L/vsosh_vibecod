import os
import random

DIR = "tests"
os.makedirs(DIR, exist_ok=True)

def solve(s: str) -> int:
    x = y = 0
    for c in s:
        if c == "U":
            y += 1
        elif c == "D":
            y -= 1
        elif c == "L":
            x -= 1
        elif c == "R":
            x += 1
    return abs(x) + abs(y)

def gen_case(n, mode):
    if mode == "random":
        return ''.join(random.choice("UDLR") for _ in range(n))

    if mode == "biased":
        # больше движений в одну сторону
        return ''.join(random.choices(
            ["U", "D", "L", "R"],
            weights=[3, 3, 2, 2],
            k=n
        ))

    if mode == "cancel":
        # почти всё компенсируется
        s = []
        for _ in range(n // 2):
            s.append("U")
            s.append("D")
        for _ in range(n - len(s)):
            s.append(random.choice("LR"))
        random.shuffle(s)
        return ''.join(s)

    if mode == "worst":
        # максимально далеко от нуля
        return "R" * (n // 2) + "U" * (n - n // 2)

    return ''.join(random.choice("UDLR") for _ in range(n))


modes = ["random", "biased", "cancel", "worst"]

for i in range(1, 11):
    n = random.randint(1, 10**6)
    mode = random.choice(modes)

    s = gen_case(n, mode)
    ans = solve(s)

    name = f"{i:02d}"

    with open(os.path.join(DIR, name), "w") as f:
        f.write(s)

    with open(os.path.join(DIR, name + ".a"), "w") as f:
        f.write(str(ans))

print("Tests generated in folder 'tests'")