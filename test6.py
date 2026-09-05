from collections import Counter

s = input().strip()

freq = Counter(s)

max_count = max(freq.values())

answer = min(
    ch for ch, cnt in freq.items()
    if cnt == max_count
)

print(answer)