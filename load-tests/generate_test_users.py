#!/usr/bin/env python3
"""
Generate CSV file with 50 test user accounts for load testing.

Usage:
    python generate_test_users.py > test_users.csv
"""

print("email,password,role")
for i in range(1, 51):
    print(f"test.user{i}@example.com,TestPassword123!,counselor")
