# Project previews

The two local MP4s are silent, lightweight conversions of existing portfolio assets:

- `rogue-dungeon-preview.mp4`: `assets/gif/dungeon-rogue/rng-levels.gif`
- `last-online-preview.mp4`: `assets/gif/lastonline/gameplay.gif`

The Last Online poster is the first frame of `assets/gif/lastonline/main.gif`.
These are gameplay previews, not official trailers. The remaining cards use the
official Steam, YouTube or Vimeo sources recorded in `index.html`.

Only an intentional hover or a play-button activation loads a player. Hover is
disabled for reduced motion and Save-Data preferences. Media stops when the card
leaves view, the visitor leaves the card, or the document becomes hidden. Touch
users can play and pause explicitly. The original image and source link remain
available if JavaScript, autoplay, an embed or the remote service is unavailable.

Run `npm ci` and `npm run build` to refresh the local player libraries in
`assets/vendor`. Their licenses are shipped alongside the scripts. No external
player API is fetched at page load; YouTube's API loads on interaction only.
