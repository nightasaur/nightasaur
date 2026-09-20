# Mobile layout acceptance

Use `/_checks/mobile.html` on a deployment of this repository. It loads the actual
same-origin application in a fixed 375, 390 or 430 CSS-pixel iframe. It does not
read credentials, cookies, storage, user content or request bodies. Measurements
contain widths and an overflow flag only; no telemetry is transmitted.

The framed application retains normal authentication and behavior. Use public
pages first. For protected pages use a dedicated QA account where available;
never bypass authentication. Do not trigger payment, publication, deletion or
other unrelated production mutations during layout acceptance.

For each width:
1. Check the homepage, login, registration and IELTS product page.
2. Open/close the mobile navigation. Check language dropdown placement and that
   selecting a navigation link closes the menu.
3. After content settles, press the measurement button and require content width
   no greater than viewport width (one pixel tolerance).
4. Inspect a screenshot for clipped controls, overlapping text and tap targets.
5. Test authenticated dashboard, spirit list/detail and assistant with an
   authorized session, recording that scope separately.

These results certify responsive CSS layout only. Physical-device Safari,
software keyboard, touch/voice permissions, dynamic viewport height and safe-area
behavior require an actual-device check and must not be reported as passed from
an iframe. On a phone narrower than the selected size the outer test canvas can
scroll intentionally; measure the inner viewport, not the test canvas.
