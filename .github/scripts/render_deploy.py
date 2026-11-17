"""Deploy one immutable commit, wait for Render, then verify API health."""
import json
import os
import re
import time
import urllib.error
import urllib.request


def request_json(url, token=None, body=None):
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    request = urllib.request.Request(url, headers=headers, data=data)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        # Do not print response bodies or authenticated requests.
        raise RuntimeError(f"HTTP {error.code} from deployment service") from None


def deploy(api_key, service_id, commit, backend_url, expected_version, *, request=request_json, sleep=time.sleep, attempts=90):
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Expected a full Git commit SHA")
    if not re.fullmatch(r"srv-[a-z0-9]+", service_id):
        raise ValueError("Invalid Render service ID")
    if not backend_url.startswith("https://") or not api_key:
        raise ValueError("Render API key and HTTPS backend URL are required")
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", expected_version):
        raise ValueError("Expected a stable backend release version")
    endpoint = f"https://api.render.com/v1/services/{service_id}/deploys"
    result = request(endpoint, api_key, {"commitId": commit, "clearCache": "do_not_clear"})
    deploy_id = result["id"]
    if not re.fullmatch(r"dep-[a-z0-9]+", deploy_id):
        raise RuntimeError("Invalid Render deployment ID")
    for _ in range(attempts):
        result = request(f"{endpoint}/{deploy_id}", api_key)
        status = result["status"]
        print(f"Render {deploy_id}: {status}", flush=True)
        if status == "live":
            if result.get("commit", {}).get("id") != commit:
                raise RuntimeError("Render deployed a different commit")
            break
        if status in {"build_failed", "update_failed", "pre_deploy_failed", "canceled", "deactivated"}:
            raise RuntimeError(f"Render deployment failed: {status}")
        sleep(15)
    else:
        raise TimeoutError("Render deployment did not become live within the time limit")
    for _ in range(12):
        try:
            health = request(backend_url.rstrip("/") + "/health")
            if (health.get("status") == "ok" and health.get("database") == "up"
                    and health.get("version") == expected_version):
                return deploy_id
        except (RuntimeError, OSError, ValueError):
            pass
        sleep(10)
    raise RuntimeError("Render is live but the health check failed or the backend version does not match")


if __name__ == "__main__":
    deploy_id = deploy(os.environ["RENDER_API_KEY"], os.environ["RENDER_SERVICE_ID"],
                       os.environ["RELEASE_SHA"], os.environ["BACKEND_URL"],
                       os.environ["BACKEND_TAG"].removeprefix("backend-v"))
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as summary:
        summary.write(f"\nBackend deployed: `{deploy_id}` at `{os.environ['RELEASE_SHA']}`. Health check passed.\n")
