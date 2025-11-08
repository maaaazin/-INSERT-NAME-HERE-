# Create C++ Assignment via cURL

## Step 1: Get Teacher Token

First, login as a teacher to get the JWT token:

```bash
# Replace with your teacher credentials
API_URL="http://localhost:3000"
TEACHER_EMAIL="teacher@example.com"
TEACHER_PASSWORD="password123"

# Login and get token
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEACHER_EMAIL\",\"password\":\"$TEACHER_PASSWORD\"}" | jq -r '.token')

echo "Token: $TOKEN"
```

## Step 2: Create the C++ Assignment

```bash
# Create assignment: "Find Maximum Element in Array"
ASSIGNMENT_RESPONSE=$(curl -s -X POST "$API_URL/api/assignments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Find Maximum Element in Array",
    "description": "Write a C++ program that finds the maximum element in an array.\n\n**Problem Statement:**\nGiven an array of integers, find and return the maximum element.\n\n**Input Format:**\n- First line contains an integer N (1 ≤ N ≤ 1000), the size of the array\n- Second line contains N space-separated integers\n\n**Output Format:**\nPrint a single integer representing the maximum element in the array.\n\n**Example:**\nInput:\n5\n3 7 2 9 1\n\nOutput:\n9\n\n**Constraints:**\n- 1 ≤ N ≤ 1000\n- -10^9 ≤ array elements ≤ 10^9",
    "language": "cpp",
    "batch_id": 1,
    "instructor_id": 1,
    "due_date": "2025-12-31T23:59:59Z",
    "status": "active",
    "max_score": 100
}')

ASSIGNMENT_ID=$(echo "$ASSIGNMENT_RESPONSE" | jq -r '.assignment_id')
echo "Assignment created with ID: $ASSIGNMENT_ID"
```

## Step 3: Add Test Cases

```bash
# Test Case 1: Basic test
curl -s -X POST "$API_URL/api/testcases" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"assignment_id\": $ASSIGNMENT_ID,
    \"input_data\": \"5\\n3 7 2 9 1\",
    \"expected_output\": \"9\",
    \"points\": 20,
    \"is_public\": true,
    \"input_format\": \"multiline\",
    \"comparison_mode\": \"exact\"
}"

# Test Case 2: Single element
curl -s -X POST "$API_URL/api/testcases" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"assignment_id\": $ASSIGNMENT_ID,
    \"input_data\": \"1\\n42\",
    \"expected_output\": \"42\",
    \"points\": 15,
    \"is_public\": true,
    \"input_format\": \"multiline\",
    \"comparison_mode\": \"exact\"
}"

# Test Case 3: Negative numbers
curl -s -X POST "$API_URL/api/testcases" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"assignment_id\": $ASSIGNMENT_ID,
    \"input_data\": \"4\\n-5 -2 -10 -1\",
    \"expected_output\": \"-1\",
    \"points\": 15,
    \"is_public\": true,
    \"input_format\": \"multiline\",
    \"comparison_mode\": \"exact\"
}"

# Test Case 4: Large array
curl -s -X POST "$API_URL/api/testcases" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"assignment_id\": $ASSIGNMENT_ID,
    \"input_data\": \"10\\n1 2 3 4 5 6 7 8 9 10\",
    \"expected_output\": \"10\",
    \"points\": 15,
    \"is_public\": true,
    \"input_format\": \"multiline\",
    \"comparison_mode\": \"exact\"
}"

# Test Case 5: All same elements
curl -s -X POST "$API_URL/api/testcases" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"assignment_id\": $ASSIGNMENT_ID,
    \"input_data\": \"5\\n5 5 5 5 5\",
    \"expected_output\": \"5\",
    \"points\": 10,
    \"is_public\": false,
    \"input_format\": \"multiline\",
    \"comparison_mode\": \"exact\"
}"

# Test Case 6: Maximum at beginning
curl -s -X POST "$API_URL/api/testcases" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"assignment_id\": $ASSIGNMENT_ID,
    \"input_data\": \"6\\n100 50 25 10 5 1\",
    \"expected_output\": \"100\",
    \"points\": 10,
    \"is_public\": false,
    \"input_format\": \"multiline\",
    \"comparison_mode\": \"exact\"
}"

# Test Case 7: Maximum at end
curl -s -X POST "$API_URL/api/testcases" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"assignment_id\": $ASSIGNMENT_ID,
    \"input_data\": \"6\\n1 5 10 25 50 100\",
    \"expected_output\": \"100\",
    \"points\": 10,
    \"is_public\": false,
    \"input_format\": \"multiline\",
    \"comparison_mode\": \"exact\"
}"

# Test Case 8: Mixed positive and negative
curl -s -X POST "$API_URL/api/testcases" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"assignment_id\": $ASSIGNMENT_ID,
    \"input_data\": \"7\\n-10 5 -3 20 -1 15 0\",
    \"expected_output\": \"20\",
    \"points\": 5,
    \"is_public\": false,
    \"input_format\": \"multiline\",
    \"comparison_mode\": \"exact\"
}"

echo "All test cases created!"
```

## Complete One-Liner Script

```bash
#!/bin/bash
API_URL="http://localhost:3000"
TEACHER_EMAIL="teacher@example.com"
TEACHER_PASSWORD="password123"

# Get token
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEACHER_EMAIL\",\"password\":\"$TEACHER_PASSWORD\"}" | jq -r '.token')

# Create assignment
ASSIGNMENT_ID=$(curl -s -X POST "$API_URL/api/assignments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Find Maximum Element in Array",
    "description": "Write a C++ program that finds the maximum element in an array.\n\n**Problem Statement:**\nGiven an array of integers, find and return the maximum element.\n\n**Input Format:**\n- First line contains an integer N (1 ≤ N ≤ 1000), the size of the array\n- Second line contains N space-separated integers\n\n**Output Format:**\nPrint a single integer representing the maximum element in the array.\n\n**Example:**\nInput:\n5\n3 7 2 9 1\n\nOutput:\n9",
    "language": "cpp",
    "batch_id": 1,
    "instructor_id": 1,
    "due_date": "2025-12-31T23:59:59Z",
    "status": "active",
    "max_score": 100
}' | jq -r '.assignment_id')

echo "Assignment ID: $ASSIGNMENT_ID"

# Add test cases
for i in {1..8}; do
  case $i in
    1) INPUT="5\n3 7 2 9 1"; OUTPUT="9"; POINTS=20; PUBLIC=true ;;
    2) INPUT="1\n42"; OUTPUT="42"; POINTS=15; PUBLIC=true ;;
    3) INPUT="4\n-5 -2 -10 -1"; OUTPUT="-1"; POINTS=15; PUBLIC=true ;;
    4) INPUT="10\n1 2 3 4 5 6 7 8 9 10"; OUTPUT="10"; POINTS=15; PUBLIC=true ;;
    5) INPUT="5\n5 5 5 5 5"; OUTPUT="5"; POINTS=10; PUBLIC=false ;;
    6) INPUT="6\n100 50 25 10 5 1"; OUTPUT="100"; POINTS=10; PUBLIC=false ;;
    7) INPUT="6\n1 5 10 25 50 100"; OUTPUT="100"; POINTS=10; PUBLIC=false ;;
    8) INPUT="7\n-10 5 -3 20 -1 15 0"; OUTPUT="20"; POINTS=5; PUBLIC=false ;;
  esac
  
  curl -s -X POST "$API_URL/api/testcases" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"assignment_id\": $ASSIGNMENT_ID,
      \"input_data\": \"$INPUT\",
      \"expected_output\": \"$OUTPUT\",
      \"points\": $POINTS,
      \"is_public\": $PUBLIC,
      \"input_format\": \"multiline\",
      \"comparison_mode\": \"exact\"
    }" > /dev/null
done

echo "✅ Assignment and test cases created successfully!"
echo "Assignment ID: $ASSIGNMENT_ID"
```

## Correct Solution Code

Here's the working C++ solution:

```cpp
#include <iostream>
#include <climits>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    int arr[n];
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    int maxElement = INT_MIN;
    for (int i = 0; i < n; i++) {
        if (arr[i] > maxElement) {
            maxElement = arr[i];
        }
    }
    
    cout << maxElement << endl;
    return 0;
}
```

## Alternative Solution (Using vector)

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    vector<int> arr(n);
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    int maxElement = *max_element(arr.begin(), arr.end());
    cout << maxElement << endl;
    
    return 0;
}
```

## Alternative Solution (Simpler approach)

```cpp
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    int maxElement;
    cin >> maxElement; // Read first element
    
    for (int i = 1; i < n; i++) {
        int num;
        cin >> num;
        if (num > maxElement) {
            maxElement = num;
        }
    }
    
    cout << maxElement << endl;
    return 0;
}
```

All three solutions will pass all test cases!

