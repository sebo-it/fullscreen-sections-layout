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
- instructions popup with slider,
- RWD.

For testers who use web browser responsive mode: I've implemented rule, which check only once if user has touchscreen or not (I think that, in the real world it is unheard to switch on/off touchscreen, maybe users with touchscreen laptops can do this, but it's not certain if JS catch this information when the website is running), so while tests (if you would turn on/off touchscreen) you probably need to: switch on/off responsive mode, clear cache and refresh the page. You should see another appointment.

Previous Git history won't be published.

Any feedback is welcome.
