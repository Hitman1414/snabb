def test_settings_patched(client):
    from app.config import settings
    from app.middleware.rate_limit import settings as rl_settings
    import sys
    print(f"\nDEBUG id(conftest_settings)={id(settings)}, id(rl_settings)={id(rl_settings)}", file=sys.stderr)
    print(f"DEBUG RATE_LIMIT_ENABLED = {settings.RATE_LIMIT_ENABLED}", file=sys.stderr)
    print(f"DEBUG same object = {settings is rl_settings}", file=sys.stderr)
    for i in range(7):
        r = client.post('/auth/register', json={'username':f'dbg{i}','email':f'dbg{i}@x.com','password':'Password1','phone_number':'+10000000001','location':'X'})
        print(f"DEBUG req {i+1}: {r.status_code}", file=sys.stderr)
