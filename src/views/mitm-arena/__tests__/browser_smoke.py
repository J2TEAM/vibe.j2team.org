"""UI checks only; this does not establish multiplayer WebRTC connectivity.

  python src/views/mitm-arena/__tests__/browser_smoke.py \
    --url http://127.0.0.1:5173/mitm-arena --output work/mitm-ui
"""
import argparse
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright, expect


async def run(args):
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    errors = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=args.chromium, headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.goto(args.url, wait_until="networkidle")
        await expect(page.get_by_role("heading", level=1)).to_contain_text("Giữa Đường")
        await expect(page.get_by_test_id("create-room")).to_be_disabled()
        await page.screenshot(path=str(output / "landing-desktop.png"), full_page=True)
        await page.set_viewport_size({"width": 390, "height": 844})
        assert await page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        await page.screenshot(path=str(output / "landing-mobile.png"), full_page=True)
        await page.get_by_test_id("player-name").fill("Duc")
        await page.get_by_role("button", name="Tham gia", exact=True).click()
        await page.get_by_test_id("join-code").fill("không-phải-mã-mời")
        await page.get_by_test_id("join-room").click()
        await expect(page.get_by_test_id("arena-error")).to_contain_text("Mã mời không hợp lệ")
        await page.get_by_role("button", name="Tạo phòng", exact=True).click()
        await page.get_by_test_id("create-room").click()
        await expect(page.get_by_test_id("start-game")).to_be_disabled()
        await expect(page.get_by_test_id("ready")).to_be_visible()
        assert await page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        await page.screenshot(path=str(output / "lobby-mobile.png"), full_page=True)
        await page.get_by_test_id("ready").click()
        await expect(page.get_by_test_id("start-game")).to_be_disabled()
        await page.get_by_test_id("leave-room").click()
        await expect(page.get_by_test_id("player-name")).to_be_visible()
        assert not errors, errors
        report = {"passed": True, "checks": ["landing", "required-name", "invalid-code", "three-player-start-gate", "leave-cleanup", "390px-no-overflow"], "native_multiplayer_tested": False, "browser_errors": errors}
        (output / "smoke-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False))
        await browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:5173/mitm-arena")
    parser.add_argument("--output", default="work/mitm-ui")
    parser.add_argument("--chromium", default="/usr/bin/chromium")
    asyncio.run(run(parser.parse_args()))
