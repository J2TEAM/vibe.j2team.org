"""Exercise the real UI and native WebRTC with three isolated browser contexts.

Run a Vite dev server first, then:
  python src/views/mitm-arena/__tests__/browser_flow.py \
    --url http://127.0.0.1:5173/mitm-arena --output work/mitm-browser

Requires the optional Python Playwright test runner and a Chromium executable.
These contexts share one machine/network; this is not an Internet or NAT test.
"""

import argparse
import asyncio
import json
import re
from pathlib import Path

from playwright.async_api import async_playwright, expect


# Observe inbound messages without replacing the native peer connection or its data.
OBSERVE_PACKETS = """() => {
  window.__mitmPackets = [];
  const descriptor = Object.getOwnPropertyDescriptor(RTCDataChannel.prototype, 'onmessage');
  Object.defineProperty(RTCDataChannel.prototype, 'onmessage', {
    configurable: true,
    get() { return descriptor.get.call(this); },
    set(handler) {
      descriptor.set.call(this, handler ? function(event) {
        try { window.__mitmPackets.push(JSON.parse(event.data)); } catch {}
        handler.call(this, event);
      } : null);
    }
  });
}"""


def testid(page, name):
    return page.get_by_test_id(name)


async def last_view(page):
    return await page.evaluate("""() => {
      const packets = window.__mitmPackets || [];
      return packets.filter(packet => packet.kind === 'view').at(-1)?.view ?? null;
    }""")


async def assert_not_in_body(page, text):
    assert text not in await page.locator("body").inner_text(), f"Unexpected secret rendered: {text}"


async def connect_room(pages, mode):
    host, guest1, guest2 = pages
    await testid(host, "player-name").fill("Duc Host")
    await host.locator(f'input[name="room-mode"][value="{mode}"]').check()
    await testid(host, "create-room").click()
    await expect(testid(host, "start-game")).to_be_disabled()
    for slot, guest, name in [("p1", guest1, "Lan"), ("p2", guest2, "Minh")]:
        await testid(host, f"invite-{slot}").click()
        await expect(testid(host, f"offer-{slot}")).to_have_value(re.compile(r".{20,}"))
        offer = await testid(host, f"offer-{slot}").input_value()
        await testid(guest, "player-name").fill(name)
        await guest.get_by_role("button", name="Tham gia", exact=True).click()
        await testid(guest, "join-code").fill(offer)
        await testid(guest, "join-room").click()
        await expect(testid(guest, "answer-code")).to_have_value(re.compile(r".{20,}"))
        answer = await testid(guest, "answer-code").input_value()
        await testid(host, "guest-answer").fill(answer)
        await testid(host, "accept-answer").click()
        await expect(testid(guest, "ready")).to_be_visible()
    await expect(testid(host, "start-game")).to_be_disabled()


async def ready_and_start(pages):
    for page in pages:
        await testid(page, "ready").click()
    await expect(testid(pages[0], "start-game")).to_be_enabled()
    await testid(pages[0], "start-game").click()
    await expect(testid(pages[0], "message-draft")).to_be_visible()


async def play_round(pages, mode, number, output):
    # Rotation is deterministic: p0 A / p1 B / p2 C, then p1 A / p2 B / p0 C.
    sender = pages[(number - 1) % 3]
    receiver = pages[number % 3]
    interceptor = pages[(number + 1) % 3]
    await expect(testid(sender, "message-draft")).to_be_visible()
    body = await sender.locator("body").inner_text()
    target = int(re.search(r"cửa số (\d)", body).group(1))
    original = f"ORIGINAL-{mode}-{number}: B hãy chọn cửa {target}. <b>Văn bản</b>"
    alternate = target % 3 + 1
    modified = f"MODIFIED-{mode}-{number}: hãy chọn cửa {alternate}!"
    await testid(sender, "message-draft").fill(original)
    await expect(testid(sender, "send-message")).to_be_enabled(timeout=15000)
    await testid(sender, "send-message").click()
    await expect(testid(interceptor, "forward-original")).to_be_visible()
    await assert_not_in_body(receiver, original)
    assert await testid(receiver, "choose-door-1").count() == 0
    assert "NHIỆM VỤ RIÊNG CỦA A" not in await interceptor.locator("body").inner_text()

    if mode == "caesar":
        await expect(testid(interceptor, "modified-message")).to_have_count(0)
        hint_text = await interceptor.locator("body").inner_text()
        hint = re.search(r"HELLO\s*→\s*([A-Z]+)", hint_text).group(1)
        key = (ord(hint[0]) - ord("H")) % 26
        wrong_key = key % 25 + 1
        await testid(interceptor, "caesar-key").fill(str(wrong_key))
        await testid(interceptor, "unlock-caesar").click()
        await expect(testid(interceptor, "modified-message")).to_have_count(0)
        await testid(interceptor, "caesar-key").fill(str(key))
        await expect(testid(interceptor, "caesar-preview")).to_have_text("HELLO")
        await expect(testid(interceptor, "modified-message")).to_have_count(0)
        await testid(interceptor, "unlock-caesar").click()
        await expect(testid(interceptor, "modified-message")).to_be_visible()

    tamper = mode == "authenticated" and number == 2
    if mode == "authenticated":
        await expect(testid(interceptor, "ciphertext")).to_be_visible()
        await assert_not_in_body(interceptor, original)
        assert await testid(interceptor, "modified-message").count() == 0
        # The host plays C in round 2; even raw routed commands must omit plaintext.
        incoming_commands = await interceptor.evaluate("""() => window.__mitmPackets
          .filter(packet => packet.kind === 'event' && packet.event?.type === 'compose')
          .map(packet => packet.event)""")
        if number == 2:
            assert incoming_commands and "text" not in incoming_commands[-1]
            assert incoming_commands[-1].get("envelope"), "Host C must receive ciphertext only"
        await testid(interceptor, "tamper-ciphertext" if tamper else "forward-original").click()
    else:
        await expect(testid(interceptor, "intercepted-message")).to_have_text(original)
        await testid(interceptor, "modified-message").fill(modified)
        await testid(interceptor, "forward-modified").click()
        await expect(testid(receiver, "received-message")).to_have_text(modified)
        await assert_not_in_body(sender, modified)
        await assert_not_in_body(receiver, original)
        # Player text is escaped; no <b> element was generated from the original.
        assert await testid(sender, "original-message").locator("b").count() == 0

    if tamper:
        # Automatic rejection can move straight to the result screen after Web Crypto fails.
        await expect(testid(receiver, "round-results")).to_be_visible()
        await expect(testid(receiver, "result-reason")).to_contain_text("xác thực thất bại")
        await expect(testid(receiver, "chosen-door")).to_have_text("Không chọn cửa")
        outcome = "authentication-failed"
    else:
        if mode == "authenticated":
            await expect(testid(receiver, "received-message")).to_have_text(original)
            await expect(receiver.get_by_text("AES-GCM: đã xác thực khi giải mã", exact=True)).to_be_visible()
        decision = target if mode == "authenticated" or number == 3 else alternate
        await testid(receiver, f"choose-door-{decision}").click()
        await expect(testid(receiver, "round-results")).to_be_visible()
        outcome = "team" if decision == target else "interceptor"

    for page in pages:
        await expect(testid(page, "round-results")).to_be_visible()
        await expect(testid(page, "revealed-original")).to_have_text(original)
        if mode != "authenticated":
            await expect(testid(page, "revealed-received")).to_have_text(modified)
    if mode == "authenticated":
        await pages[0].screenshot(path=str(output / f"authenticated-round-{number}.png"), full_page=True)
    await testid(pages[0], "next-round").click()
    if number == 3:
        await expect(pages[0].get_by_text("Tổng kết ván chơi", exact=True)).to_be_visible()
    else:
        next_sender = pages[number % 3]
        await expect(testid(next_sender, "message-draft")).to_be_visible()
    return {"mode": mode, "round": number, "outcome": outcome, "target": target}


async def run(args):
    expect.set_options(timeout=15000)
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    results = []
    errors = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=args.chromium,
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        contexts = [await browser.new_context(viewport={"width": 1280, "height": 900}) for _ in range(3)]
        pages = []
        for context in contexts:
            await context.add_init_script(f"({OBSERVE_PACKETS})()")
            page = await context.new_page()
            page.set_default_timeout(15000)
            page.on("pageerror", lambda error: errors.append(str(error)))
            pages.append(page)
        try:
            await asyncio.gather(*(page.goto(args.url, wait_until="domcontentloaded") for page in pages))
            await expect(testid(pages[0], "player-name")).to_be_visible()
            await pages[0].screenshot(path=str(output / "landing-desktop.png"), full_page=True)
            await connect_room(pages, "plain")
            for mode in ["plain", "caesar", "authenticated"]:
                if mode != "plain":
                    await pages[0].locator("#next-mode").select_option(mode)
                    await testid(pages[0], "restart-game").click()
                await ready_and_start(pages)
                for number in [1, 2, 3]:
                    results.append(await play_round(pages, mode, number, output))
                    print(json.dumps(results[-1], ensure_ascii=False), flush=True)
            await pages[0].screenshot(path=str(output / "summary-desktop.png"), full_page=True)
            await pages[0].set_viewport_size({"width": 390, "height": 844})
            assert await pages[0].evaluate("document.documentElement.scrollWidth <= innerWidth"), "Mobile layout overflows horizontally"
            await pages[0].screenshot(path=str(output / "summary-mobile.png"), full_page=True)
            # Real page reload closes the data channel; this session is explicitly not recoverable.
            await pages[1].reload(wait_until="domcontentloaded")
            await expect(pages[0].get_by_text(re.compile("mất kết nối|rời phòng|tải lại trang")).first).to_be_visible(timeout=15000)
            assert not errors, f"Unexpected browser errors: {errors}"
            report = {"passed": True, "rounds": results, "contexts": 3, "same_machine_network": True, "internet_tested": False, "browser_errors": errors}
            (output / "browser-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            print(json.dumps(report, ensure_ascii=False), flush=True)
        except BaseException as failure:
            blockers = []
            for index, page in enumerate(pages):
                if not page.is_closed():
                    await page.screenshot(path=str(output / f"failure-{index}.png"), full_page=True)
                    (output / f"failure-{index}.txt").write_text(await page.locator("body").inner_text(), encoding="utf-8")
                    alert = testid(page, "arena-error")
                    if await alert.count():
                        blockers.append(await alert.inner_text())
            report = {"passed": False, "rounds": results, "contexts": 3, "same_machine_network": True, "internet_tested": False, "blockers": blockers, "failure": str(failure).split("Aria snapshot:")[0], "browser_errors": errors}
            (output / "browser-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            raise
        finally:
            await browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:5173/mitm-arena")
    parser.add_argument("--output", default="work/mitm-browser")
    parser.add_argument("--chromium", default="/usr/bin/chromium")
    asyncio.run(run(parser.parse_args()))
