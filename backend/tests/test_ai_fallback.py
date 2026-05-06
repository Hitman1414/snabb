import sys
sys.stdout = open('result3.txt', 'w', encoding='utf-8')
sys.stderr = sys.stdout

from app.routers.ai import generate_with_fallback

try:
    print(generate_with_fallback('Test prompt'))
except Exception as e:
    print('CAUGHT:', str(e))
