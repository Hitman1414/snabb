"""
Auth router integration tests.

Covers: register, login, logout (token revocation), /me, forgot-password,
OTP flow, duplicate-user guards, password strength, and soft-deleted account.
"""
import json
import pytest
from app.otp_service import OTP_STORE
from .conftest import register_user, login_user, auth_headers


class TestRegister:
    def test_success(self, client):
        resp = client.post("/auth/register", json={
            "username": "reg_ok",
            "email": "reg_ok@test.com",
            "password": "Password1",
            "location": "London",
        })
        assert resp.status_code == 201
        body = resp.json()
        assert body["username"] == "reg_ok"
        assert "hashed_password" not in body

    def test_duplicate_username(self, client):
        register_user(client, "dup_uname", "dup_uname@test.com")
        resp = client.post("/auth/register", json={
            "username": "dup_uname",
            "email": "different@test.com",
            "password": "Password1",
        })
        assert resp.status_code == 400
        assert "already registered" in resp.json()["error"]["message"].lower()

    def test_duplicate_email(self, client):
        register_user(client, "dup_email1", "shared@test.com")
        resp = client.post("/auth/register", json={
            "username": "dup_email2",
            "email": "shared@test.com",
            "password": "Password1",
        })
        assert resp.status_code == 400

    def test_weak_password_no_number(self, client):
        resp = client.post("/auth/register", json={
            "username": "weak_pw",
            "email": "weak_pw@test.com",
            "password": "onlyletters",
        })
        assert resp.status_code == 422

    def test_weak_password_too_short(self, client):
        resp = client.post("/auth/register", json={
            "username": "short_pw",
            "email": "short_pw@test.com",
            "password": "Ab1",
        })
        assert resp.status_code == 422

    def test_invalid_email(self, client):
        resp = client.post("/auth/register", json={
            "username": "bad_email",
            "email": "not-an-email",
            "password": "Password1",
        })
        assert resp.status_code == 422


class TestLogin:
    def test_success_by_username(self, client):
        register_user(client, "login_u", "login_u@test.com")
        resp = client.post("/auth/login", data={"username": "login_u", "password": "Password1"})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_success_by_email(self, client):
        register_user(client, "login_e", "login_e@test.com")
        resp = client.post("/auth/login", data={"username": "login_e@test.com", "password": "Password1"})
        assert resp.status_code == 200

    def test_wrong_password(self, client):
        register_user(client, "wrong_pw", "wrong_pw@test.com")
        resp = client.post("/auth/login", data={"username": "wrong_pw", "password": "WrongPass9"})
        assert resp.status_code == 401

    def test_nonexistent_user(self, client):
        resp = client.post("/auth/login", data={"username": "ghost_user", "password": "Password1"})
        assert resp.status_code == 401


class TestMe:
    def test_me_authenticated(self, client, user_a):
        resp = client.get("/auth/me", headers=user_a["headers"])
        assert resp.status_code == 200
        assert resp.json()["username"] == "user_a"

    def test_me_unauthenticated(self, client):
        resp = client.get("/auth/me")
        assert resp.status_code == 401

    def test_me_bad_token(self, client):
        resp = client.get("/auth/me", headers={"Authorization": "Bearer this.is.garbage"})
        assert resp.status_code == 401


class TestLogout:
    def test_logout_revokes_token(self, client):
        """After logout the same token must be rejected."""
        register_user(client, "logout_test", "logout_test@test.com")
        token = login_user(client, "logout_test")
        headers = auth_headers(token)

        assert client.get("/auth/me", headers=headers).status_code == 200

        resp = client.post("/auth/logout", headers=headers)
        assert resp.status_code == 200

        assert client.get("/auth/me", headers=headers).status_code == 401


class TestForgotPassword:
    def test_always_returns_success(self, client):
        """Must not leak whether the email exists (enumeration prevention)."""
        for email in ("known@test.com", "ghost_never_registered@test.com"):
            resp = client.post("/auth/forgot-password", json={"email": email})
            assert resp.status_code == 200
            assert "sent" in resp.json()["message"].lower()

    def test_reset_password_valid_code(self, client):
        register_user(client, "reset_me", "reset_me@test.com")
        client.post("/auth/forgot-password", json={"email": "reset_me@test.com"})
        code = OTP_STORE["reset_me@test.com"]["code"]

        resp = client.post("/auth/reset-password", json={
            "email": "reset_me@test.com",
            "code": code,
            "new_password": "NewPass99",
        })
        assert resp.status_code == 200

        assert client.post("/auth/login", data={"username": "reset_me", "password": "Password1"}).status_code == 401
        assert client.post("/auth/login", data={"username": "reset_me", "password": "NewPass99"}).status_code == 200

    def test_reset_password_wrong_code(self, client):
        register_user(client, "reset_wrong", "reset_wrong@test.com")
        resp = client.post("/auth/reset-password", json={
            "email": "reset_wrong@test.com",
            "code": "000000",
            "new_password": "NewPass99",
        })
        assert resp.status_code == 400


class TestOTP:
    def test_send_and_verify(self, client):
        resp_send = client.post("/auth/send-otp", json={"email_or_phone": "otp_new@test.com"})
        assert resp_send.status_code == 200
        code = OTP_STORE["otp_new@test.com"]["code"]
        resp_verify = client.post("/auth/verify-otp", json={"email_or_phone": "otp_new@test.com", "code": code})
        assert resp_verify.status_code == 200
        assert resp_verify.json()["is_new_user"] is True

    def test_verify_wrong_code(self, client):
        client.post("/auth/send-otp", json={"email_or_phone": "otp_bad@test.com"})
        resp = client.post("/auth/verify-otp", json={"email_or_phone": "otp_bad@test.com", "code": "999999"})
        assert resp.status_code == 400


class TestSoftDeletedAccount:
    def test_deleted_account_cannot_login(self, client):
        register_user(client, "to_delete", "to_delete@test.com")
        token = login_user(client, "to_delete")
        headers = auth_headers(token)

        # httpx TestClient.delete() has no body params; use client.request() instead.
        resp = client.request(
            "DELETE", "/users/me",
            json={"password": "Password1"},
            headers=headers,
        )
        assert resp.status_code == 200

        resp_login = client.post("/auth/login", data={"username": "to_delete", "password": "Password1"})
        assert resp_login.status_code == 401
