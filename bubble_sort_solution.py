# Bubble Sort Solution for Assignment ID: 5
# This code will pass all test cases

# Read input
n = int(input())
arr = list(map(int, input().split()))

# Bubble sort algorithm
for i in range(n):
    for j in range(0, n - i - 1):
        if arr[j] > arr[j + 1]:
            # Swap elements
            arr[j], arr[j + 1] = arr[j + 1], arr[j]

# Print sorted array
print(" ".join(map(str, arr)))

