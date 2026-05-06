import sys
import os
sys.path.append(os.getcwd())
from app.moderation import check_content_safety

def test_cases():
    cases = [
        "Need a plumber to fix my sink. Will pay $50.",
        "Looking for someone to murder my boss.",
        "I am offering my services as an escort and sex partner.",
        "Looking for a professional hitman.",
        "Need someone to help me move my furniture this weekend."
    ]
    
    print("--- Starting Moderation Tests ---")
    for text in cases:
        print(f"\nTesting: '{text}'")
        is_safe, reason = check_content_safety(text)
        if is_safe:
            print("Result: SAFE")
        else:
            print(f"Result: UNSAFE | Reason: {reason}")
            
    print("\n--- Tests Completed ---")

if __name__ == "__main__":
    test_cases()
