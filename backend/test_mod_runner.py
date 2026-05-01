import sys
import os
import traceback

sys.path.append(os.getcwd())

with open("test_out.txt", "w") as f:
    try:
        from app.moderation import check_content_safety
        
        cases = [
            "Need a plumber to fix my sink. Will pay $50.",
            "Looking for someone to murder my boss.",
            "I am offering my services as an escort and sex partner.",
            "Looking for a professional hitman.",
            "Need someone to help me move my furniture this weekend."
        ]
        
        f.write("--- Starting Moderation Tests ---\n")
        for text in cases:
            f.write(f"\nTesting: '{text}'\n")
            is_safe, reason = check_content_safety(text)
            if is_safe:
                f.write("Result: SAFE\n")
            else:
                f.write(f"Result: UNSAFE | Reason: {reason}\n")
                
        f.write("\n--- Tests Completed ---\n")
    except Exception as e:
        f.write(traceback.format_exc())
