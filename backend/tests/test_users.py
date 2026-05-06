"""
Users router integration tests.

Covers: profile update, avatar upload (magic-byte validation), ID card upload,
Pro application flow (requires admin approval), approve-pro admin endpoint,
push token, and GDPR account deletion.
"""
import json
import pytest
from .conftest import register_user, login_user, auth_headers, fake_jpeg, fake_png, JPEG_MAGIC


class TestGetUser:
    def test_get_existing_user(self, client, user_a):
        user_id = client.get("/auth/me", headers=user_a["headers"]).json()["id"]
        resp = client.get(f"/users/{user_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == user_id
        assert "hashed_password" not in resp.json()

    def test_get_nonexistent_user(self, client):
        resp = client.get("/users/999999")
        assert resp.status_code == 404


class TestProfileUpdate:
    def test_update_location(self, client, user_a):
        resp = client.patch("/users/me",
                            json={"location": "New Location"},
                            headers=user_a["headers"])
        assert resp.status_code == 200
        assert resp.json()["location"] == "New Location"

    def test_duplicate_username_rejected(self, client):
        register_user(client, "taken_name", "taken_name@test.com")
        register_user(client, "wants_name", "wants_name@test.com")
        token = login_user(client, "wants_name")
        resp = client.patch("/users/me",
                            json={"username": "taken_name"},
                            headers=auth_headers(token))
        assert resp.status_code == 400

    def test_unauthenticated_update_rejected(self, client):
        resp = client.patch("/users/me", json={"location": "Hack"})
        assert resp.status_code == 401


class TestAvatarUpload:
    def test_valid_jpeg_accepted(self, client, user_a):
        name, data, ctype = fake_jpeg()
        resp = client.post("/users/me/avatar",
                           files={"file": (name, data, ctype)},
                           headers=user_a["headers"])
        assert resp.status_code == 200
        assert resp.json()["avatar_url"] is not None

    def test_valid_png_accepted(self, client, user_a):
        name, data, ctype = fake_png()
        resp = client.post("/users/me/avatar",
                           files={"file": (name, data, ctype)},
                           headers=user_a["headers"])
        assert resp.status_code == 200

    def test_fake_image_rejected(self, client, user_a):
        resp = client.post("/users/me/avatar",
                           files={"file": ("evil.jpg", b"<html>not an image</html>", "image/jpeg")},
                           headers=user_a["headers"])
        assert resp.status_code == 400

    def test_unauthenticated_upload_rejected(self, client):
        name, data, ctype = fake_jpeg()
        resp = client.post("/users/me/avatar", files={"file": (name, data, ctype)})
        assert resp.status_code == 401


class TestIdCardUpload:
    def test_valid_jpeg_accepted(self, client, user_b):
        name, data, ctype = fake_jpeg("id_card.jpg")
        resp = client.post("/users/me/id-card",
                           files={"file": (name, data, ctype)},
                           headers=user_b["headers"])
        assert resp.status_code == 200
        assert "id_card_url" in resp.json()

    def test_fake_image_rejected(self, client, user_b):
        resp = client.post("/users/me/id-card",
                           files={"file": ("id.jpg", b"%PDF-1.4 fake pdf", "image/jpeg")},
                           headers=user_b["headers"])
        assert resp.status_code == 400


class TestProApplication:
    def test_application_pending_not_auto_approved(self, client):
        """Submitting a Pro application must NOT immediately set is_pro=True."""
        register_user(client, "pro_applicant", "pro_applicant@test.com")
        token = login_user(client, "pro_applicant")
        headers = auth_headers(token)

        # Upload an ID card first (needed for application).
        name, data, ctype = fake_jpeg("id.jpg")
        id_resp = client.post("/users/me/id-card",
                              files={"file": (name, data, ctype)},
                              headers=headers)
        id_card_url = id_resp.json()["id_card_url"]

        resp = client.post("/users/me/apply-pro", json={
            "pro_category": "plumbing",
            "pro_bio": "Certified plumber with 10 years experience",
            "id_card_url": id_card_url,
        }, headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["is_pro"] is False
        assert body["pro_verified"] is False
        assert body["pro_category"] == "plumbing"

    def test_duplicate_application_rejected(self, client):
        """A second application while one is pending must be blocked."""
        register_user(client, "double_apply", "double_apply@test.com")
        token = login_user(client, "double_apply")
        headers = auth_headers(token)

        name, data, ctype = fake_jpeg()
        id_resp = client.post("/users/me/id-card",
                              files={"file": (name, data, ctype)},
                              headers=headers)
        id_url = id_resp.json()["id_card_url"]

        payload = {
            "pro_category": "cleaning",
            "pro_bio": "Professional cleaner",
            "id_card_url": id_url,
        }
        assert client.post("/users/me/apply-pro", json=payload, headers=headers).status_code == 200
        resp2 = client.post("/users/me/apply-pro", json=payload, headers=headers)
        assert resp2.status_code == 400

    def test_admin_can_approve_pro(self, client, admin_user):
        """Admin approve-pro endpoint grants is_pro=True and pro_verified=True."""
        register_user(client, "pending_pro", "pending_pro@test.com")
        token = login_user(client, "pending_pro")
        headers = auth_headers(token)

        name, data, ctype = fake_jpeg()
        id_url = client.post("/users/me/id-card",
                             files={"file": (name, data, ctype)},
                             headers=headers).json()["id_card_url"]
        user_id = client.get("/auth/me", headers=headers).json()["id"]
        client.post("/users/me/apply-pro", json={
            "pro_category": "electrician",
            "pro_bio": "Licensed electrician",
            "id_card_url": id_url,
        }, headers=headers)

        resp = client.post(f"/users/{user_id}/approve-pro", headers=admin_user["headers"])
        assert resp.status_code == 200
        assert resp.json()["is_pro"] is True
        assert resp.json()["pro_verified"] is True

    def test_non_admin_cannot_approve_pro(self, client, user_a):
        register_user(client, "another_pending", "another_pending@test.com")
        token = login_user(client, "another_pending")
        headers = auth_headers(token)
        name, data, ctype = fake_jpeg()
        id_url = client.post("/users/me/id-card",
                             files={"file": (name, data, ctype)},
                             headers=headers).json()["id_card_url"]
        user_id = client.get("/auth/me", headers=headers).json()["id"]
        client.post("/users/me/apply-pro", json={
            "pro_category": "cleaning",
            "pro_bio": "Expert cleaner",
            "id_card_url": id_url,
        }, headers=headers)

        resp = client.post(f"/users/{user_id}/approve-pro", headers=user_a["headers"])
        assert resp.status_code == 403


class TestPushToken:
    def test_update_push_token(self, client, user_a):
        resp = client.put("/users/me/push-token",
                          json={"token": "ExponentPushToken[test123]"},
                          headers=user_a["headers"])
        assert resp.status_code == 200
        me = client.get("/auth/me", headers=user_a["headers"]).json()
        assert me["expo_push_token"] == "ExponentPushToken[test123]"


class TestAccountDeletion:
    def test_wrong_password_blocked(self, client):
        register_user(client, "del_wrong_pw", "del_wrong_pw@test.com")
        token = login_user(client, "del_wrong_pw")
        # httpx TestClient.delete() has no body params; use client.request() instead.
        resp = client.request(
            "DELETE", "/users/me",
            json={"password": "WrongPass1"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 403

    def test_soft_delete_scrubs_pii(self, client):
        register_user(client, "pii_scrub", "pii_scrub@test.com")
        token = login_user(client, "pii_scrub")
        headers = auth_headers(token)
        user_id = client.get("/auth/me", headers=headers).json()["id"]

        resp = client.request(
            "DELETE", "/users/me",
            json={"password": "Password1"},
            headers=headers,
        )
        assert resp.status_code == 200

        pub = client.get(f"/users/{user_id}")
        assert pub.status_code == 404
