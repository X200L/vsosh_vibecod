n, k = map(int, input().split())
weights = list(map(int, input().split()))

weights.sort()

count = 0
current_weight = 0

for w in weights:
    if current_weight + w <= k:
        current_weight += w
        count += 1
    else:
        break

print(count)