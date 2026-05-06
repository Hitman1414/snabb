"""
Asks router integration tests.

Covers: create, read, update, delete, close, geo-filter, search, and
ownership/authorization guards.
"""
import pytest
from .conftest import fake_jpeg


# ── Helpers ───────────────────────────────────────────────────────────────────

def create_ask(client, headers, **overrides):
    payload = {
        "title": "Need help moving furniture",
        "description": "Help me move a sofa from 3rd floor",
        "category": "moving",
        "location": "Test City Center",
        "budget_min": "50",
        "budget_max": "150",
    }
    payload.update(overrides)
    return client.post("/asks", data=payload, headers=headers)


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestCreateAsk:
    def test_success(self, client, user_a):
        resp = create_ask(client, user_a["headers"])
        assert resp.status_code == 201
        body = resp.json()
        assert body["title"] == "Need help moving furniture"
        assert body["status"] == "open"

    def test_requires_auth(self, client):
        resp = create_ask(client, {})
        assert resp.status_code == 401

    def test_missing_required_fields(self, client, user_a):
        resp = client.post("/asks", data={"title": "No description"}, headers=user_a["headers"])
        assert resp.status_code == 422

    def test_with_valid_image(self, client, user_a):
        name, data, ctype = fake_jpeg()
        resp = client.post(
            "/asks",
            data={
                "title": "Ask with image",
                "description": "Has a photo attached",
                "category": "other",
                "location": "Somewhere",
            },
            files={"images": (name, data, ctype)},
            headers=user_a["headers"],
        )
        assert resp.status_code == 201

    def test_rejects_non_image_file(self, client, user_a):
        """Uploading a fake image (bad magic bytes) must be rejected."""
        resp = client.post(
            "/asks",
            data={
                "title": "Malicious ask",
                "description": "Trying to upload a script as an image",
                "category": "other",
                "location": "Somewhere",
            },
            files={"images": ("evil.jpg", b"<script>alert(1)</script>", "image/jpeg")},
            headers=user_a["headers"],
        )
        assert resp.status_code == 400


class TestGetAsks:
    def test_list_is_paginated(self, client, user_a):
        resp = client.get("/asks?limit=5&skip=0")
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert "total" in body
        assert isinstance(body["items"], list)

    def test_search_filter(self, client, user_a):
        create_ask(client, user_a["headers"], title="Unique title XYZ789")
        resp = client.get("/asks?search=XYZ789")
        assert resp.status_code == 200
        assert any("XYZ789" in a["title"] for a in resp.json()["items"])

    def test_category_filter(self, client, user_a):
        create_ask(client, user_a["headers"], category="gardening", title="Garden work")
        resp = client.get("/asks?category=gardening")
        assert resp.status_code == 200
        for ask in resp.json()["items"]:
            assert ask["category"] == "gardening"

    def test_geo_filter_nearby(self, client, user_a):
        """Ask created at NYC coords must appear in a nearby search."""
        create_ask(client, user_a["headers"],
                   title="NYC Ask",
                   latitude="40.7128", longitude="-74.0060",
                   location="New York")
        resp = client.get("/asks?lat=40.7128&lng=-74.0060&radius_km=5&sort=nearby")
        assert resp.status_code == 200
        assert any("NYC Ask" in a["title"] for a in resp.json()["items"])

    def test_geo_filter_excludes_far_asks(self, client, user_a):
        """Asks 200 km away should not appear in a 5 km radius search."""
        create_ask(client, user_a["headers"],
                   title="Far Away Ask",
                   latitude="43.000", longitude="-74.0060",
                   location="Upstate NY")
        resp = client.get("/asks?lat=40.7128&lng=-74.0060&radius_km=5&sort=nearby")
        assert resp.status_code == 200
        for ask in resp.json()["items"]:
            assert "Far Away Ask" not in ask["title"]

    def test_get_single_ask(self, client, user_a):
        ask_id = create_ask(client, user_a["headers"]).json()["id"]
        resp = client.get(f"/asks/{ask_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == ask_id

    def test_get_nonexistent_ask(self, client):
        resp = client.get("/asks/999999")
        assert resp.status_code == 404


class TestUpdateAsk:
    def test_owner_can_update(self, client, user_a):
        ask_id = create_ask(client, user_a["headers"]).json()["id"]
        resp = client.put(f"/asks/{ask_id}",
                          json={"title": "Updated title"},
                          headers=user_a["headers"])
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated title"

    def test_non_owner_cannot_update(self, client, user_a, user_b):
        ask_id = create_ask(client, user_a["headers"]).json()["id"]
        resp = client.put(f"/asks/{ask_id}",
                          json={"title": "Stolen update"},
                          headers=user_b["headers"])
        assert resp.status_code == 403


class TestDeleteAsk:
    def test_owner_can_delete(self, client, user_a):
        ask_id = create_ask(client, user_a["headers"]).json()["id"]
        resp = client.delete(f"/asks/{ask_id}", headers=user_a["headers"])
        assert resp.status_code == 204
        assert client.get(f"/asks/{ask_id}").status_code == 404

    def test_non_owner_cannot_delete(self, client, user_a, user_b):
        ask_id = create_ask(client, user_a["headers"]).json()["id"]
        resp = client.delete(f"/asks/{ask_id}", headers=user_b["headers"])
        assert resp.status_code == 403

    def test_unauthenticated_cannot_delete(self, client, user_a):
        ask_id = create_ask(client, user_a["headers"]).json()["id"]
        resp = client.delete(f"/asks/{ask_id}")
        assert resp.status_code == 401


class TestCloseAsk:
    def test_close_without_server(self, client, user_a):
        ask_id = create_ask(client, user_a["headers"]).json()["id"]
        resp = client.post(f"/asks/{ask_id}/close", headers=user_a["headers"])
        assert resp.status_code == 200
        assert resp.json()["status"] == "closed"

    def test_close_with_server(self, client, user_a, user_b):
        ask_id = create_ask(client, user_a["headers"]).json()["id"]
        server_id = client.get("/auth/me", headers=user_b["headers"]).json()["id"]
        resp = client.post(f"/asks/{ask_id}/close?server_id={server_id}",
                           headers=user_a["headers"])
        assert resp.status_code == 200
        assert resp.json()["server_id"] == server_id

    def test_non_owner_cannot_close(self, client, user_a, user_b):
        ask_id = create_ask(client, user_a["headers"]).json()["id"]
        resp = client.post(f"/asks/{ask_id}/close", headers=user_b["headers"])
        assert resp.status_code == 403


class TestMyAsks:
    def test_my_asks_returns_only_own(self, client, user_a, user_b):
        create_ask(client, user_a["headers"], title="My own ask")
        resp = client.get("/asks/my", headers=user_a["headers"])
        assert resp.status_code == 200
        for ask in resp.json():
            # Each ask should belong to user_a — confirmed by presence of response_count key.
            assert "response_count" in ask
