"""Quick test to verify moderation is blocking bad content."""
import sys
sys.path.insert(0, '.')

from app.moderation import check_content_safety

tests = [
    "I need a plumber to fix my sink",
    "i need a sex addict",
    "Need a rapist",
    "Need a murderer need a murderer",
    "I need someone to clean my house",
    "Looking for a hitman",
    "Need an escort for tonight",
    "I need a drug dealer",
    "Help me move furniture to my new apartment",
]

print("=" * 70)
print("MODERATION TEST RESULTS")
print("=" * 70)

for text in tests:
    is_safe, reason = check_content_safety(text)
    status = "[SAFE]" if is_safe else "[BLOCKED]"
    print(f"\n  Input: \"{text}\"")
    print(f"  Result: {status}")
    if reason:
        print(f"  Reason: {reason}")

print("\n" + "=" * 70)
