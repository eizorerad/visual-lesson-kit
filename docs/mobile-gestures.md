# Mobile gestures

The player supports a one-finger horizontal swipe on the drawing: left calls `D.deck.next()`, right calls `D.deck.prev()`. Navigation buttons remain available. Browser pinch zoom is preserved as a native gesture; the player does not implement its own camera, zoom transform or two-finger navigation command.

## Gesture scope and recognition

A swipe must start inside `.film-viz` or an explicit `[data-swipe-canvas]` element within `#frame`. Stage margins, headings, captions, notes, questions, the guide, overview, help and source panels do not start slide navigation. Mouse and pen streams are left alone.

A completed swipe must move at least 46 CSS pixels horizontally within 800 milliseconds, drift no more than 70 pixels vertically, and have horizontal displacement at least 1.5 times its vertical displacement. These are screen coordinates, independent of the lesson's 1280×720 drawing units. A movement that first develops vertical reading intent (at least 12 pixels vertically and more vertical than horizontal displacement) is rejected for its entire lifetime, even if the finger later moves sideways. Taps, short drags and slow reading movements do not navigate.

Inputs, buttons, links, labels, `details`/`summary`, editable content, standard interactive ARIA roles, `[data-drag]` and `[data-no-swipe]` are excluded. An active text selection also excludes the gesture. Actual scrollable ancestors between the touched element and its canvas are detected from overflow and scroll dimensions. The observer neither calls `preventDefault()` nor stops propagation; control and panel handlers retain their event stream.

Use `[data-no-swipe]` on a custom interactive region that the generic exclusions cannot recognize. Place reading panels outside the swipe canvas. This JavaScript opt-out does not override an ancestor's CSS restrictions: a horizontally scrolling widget must also have a CSS ancestor chain that permits horizontal panning. The supplied scene sliders and HTML reading panels are outside `.film-viz`.

The course-project's touch-to-tooltip adaptation remains: a single touch can synthesize `mouseenter` for a mark and its ancestors. An opened `.tip.is-on` blocks navigation. Its text remains visible after release for reading. A second contact, cancellation, window blur or touching elsewhere clears synthetic hover.

## Multiple contacts and cancellation

All active **touch pointer IDs**, including those that begin on a control or outside the drawing, are tracked with document-level passive capture listeners. A second contact invalidates the pending swipe and blocks the complete chord. A third finger, or a new finger after one of the earlier fingers lifts, cannot start another swipe while a tracked contact remains. Normal navigation starts with a fresh single contact after the chord ends.

The browser may take over a pinch and end the JavaScript pointer streams with `pointercancel`. These streams are cleaned up without navigation. A new pointer explicitly marked `isPrimary:false` cannot start a swipe even if older streams have already been cancelled; it still belongs to a multi-contact interaction. This avoids treating the remaining finger of a native gesture as a new navigation gesture.

Pointer capture is requested on the canvas only after a horizontal swipe has met the distance/direction/time criteria, never on initial contact or for controls. Releasing the finger outside the stage is observed by the document listeners. Owned capture is released on completion, cancellation, a second contact, zoom, window blur and `stop()`. Transferring the browser's initial implicit capture from the touched mark to the canvas is expected and does not cancel the swipe. Losing the canvas capture unexpectedly cancels the candidate, but does not pretend that the finger lifted: its ID stays tracked until `pointerup` or `pointercancel`. If capture is unavailable or fails, the document listeners still observe ordinary releases.

## Native pinch and required shell settings

Keep the unrestricted viewport declaration already supplied in the starter:

```html
<meta name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Do not add `user-scalable=no` or a restrictive `maximum-scale`. The shell's gesture CSS should permit browser zoom and reserve only a drawing's horizontal gesture for slide navigation:

```css
html, body { touch-action: auto; }
.film-viz, [data-swipe-canvas] { touch-action: pan-y pinch-zoom; }
body.is-zoomed .film-viz,
body.is-zoomed [data-swipe-canvas] { touch-action: auto; }
```

The relevant ancestor chain must permit pinch; do not apply blanket `touch-action:none` to stage, frame or scene. Existing narrowly scoped SVG draggables and sliders can retain their own touch behavior. Starting a pinch on such a control can invoke the control's policy; pinch the surrounding drawing or reading area instead. Notes and source panels retain native scrolling. CSS for a custom nested reading pane must permit its intended scroll axes as described above.

When `visualViewport.scale` exceeds 1.01, the runtime adds `body.is-zoomed`, cancels slide navigation, and keeps it disabled while zoomed. The CSS then allows native panning in both directions. Returning to normal scale enables fresh one-finger slide swipes again. The lesson retains its own layout-viewport fit rather than recalculating its canvas scale from the smaller visual viewport; native browser zoom supplies the enlargement.

This is actual delegation to browser pinch/pan behavior, not a simulated two-finger effect. It depends on native Pointer Events, touch-action handling and the browser's zoom support. `visualViewport` is used when available; the player does not synthesize a replacement scale sensor for older engines. Three-finger commands, gesture rotation, trackpad pinch interception and custom slide zoom controls are not implemented.

## Lifecycle and integration

Load `js/lib/touch.js` after the i18n helper. `D.deck.boot()` calls `D.touch.start()`; no additional HTML or scene hook is required. Calling `start()` again has no effect. `D.touch.stop()` removes listeners, timers and hints and releases owned capture; a later `start()` can attach them again. `D.touch.isOn()` reports the persistent touch UI mode. Visibility loss and window blur cancel pending gestures so they cannot resume against a replaced or unfocused scene. A detached starting canvas is also rejected before navigation.

The touch hint uses `D.i18n.ui('swipeHint')`. This module does not translate authored slide text or notes; that is the lesson's language layer.

## Provenance and verification

The touch-navigation and mobile-shell work adapts locally developed course lesson implementations. The kit replaces their swipe recognition with the scoped contact state machine documented above, retains native browser pinch/pan and respects custom drag opt-outs. The [provenance notes](provenance.md) describe the development history and licensing and third-party attribution.

`node --test tests/touch.cjs` runs seven jsdom tests: directional navigation; vertical/diagonal/slow paths; two/three-finger chords and non-primary contacts; controls and scroll paths; capture transfer/release, cancellation and restart; zoom-state navigation suppression; and tooltip/blur cleanup. Every dispatched pointer event is also checked for an unchanged default-prevention state.

These tests inject pointer events, capture ownership and visual-viewport scale. They verify the JavaScript state machine; they do **not** reproduce browser gesture arbitration or demonstrate pinch on physical hardware. Real touchscreen pinch, zoomed panning, panel scrolling and control operation require a device/browser pass with the shell CSS and viewport settings above.
