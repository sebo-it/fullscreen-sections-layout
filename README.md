Website layout - fullscreen sections, which can be slide by:
- URL,
- scroll wheel,
- mouse swipe,
- keyboard buttons,
- UI arrows,
- anchor links.

I used pure JavaScript without any framework or library.

Interesting part of code:
- navigation (UI) is adapted to touchscreen availability,
- custom JavaScript events,
- custom callbacks,
- animation based on requestAnimationFrame function,
- localStorage,
- basic JSDoc documentation,
- dynamic menu,
- instructions with slider.

For testers who use web browser responsive mode: I've implemented rule, which check only once (in the real world: do we often switch on / off touchscreen? :)) if user has touchscreen or not, so while tests you probably need to, clear cache and refresh page with changing responsive mode options. You should see another appointment with instructions, when you clear cache and reload page.

Previous Git history won't be published.

Any feedback is welcome.
