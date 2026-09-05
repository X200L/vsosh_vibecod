commands = input().strip()

x = 0
y = 0

for cmd in commands:
    if cmd == "U":
        y += 1
    elif cmd == "D":
        y -= 1
    elif cmd == "L":
        x -= 1
    elif cmd == "R":
        x += 1

print(abs(x) + abs(y))