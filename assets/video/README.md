# Project previews

The two local MP4s are silent, lightweight conversions of existing portfolio assets:

- `rogue-dungeon-preview.mp4`: `assets/gif/dungeon-rogue/rng-levels.gif`
- `last-online-preview.mp4`: `assets/gif/lastonline/gameplay.gif` (since removed; see below)

The Last Online poster is the first frame of `assets/gif/lastonline/main.gif`.
These are gameplay previews, not official trailers. The remaining cards use the
official Steam, YouTube or Vimeo sources recorded in `index.html`.

Only an intentional hover or a play-button activation loads a player. Hover is
disabled for reduced motion and Save-Data preferences. Media stops when the card
leaves view, the visitor leaves the card, or the document becomes hidden. Touch
users can play and pause explicitly. The original image and source link remain
available if JavaScript, autoplay, an embed or the remote service is unavailable.

# Case study clips

The subfolders (`corgi/`, `dungeon-rogue/`, `lastonline/`) hold muted, looping
H.264 MP4s that replaced the case study GIFs of the same name (~27 MB of GIFs
became ~2 MB). They were encoded with ffmpeg at the GIFs' native resolution:

    ffmpeg -i in.gif -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
      -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -movflags +faststart out.mp4

The source GIFs were deleted afterwards and remain available in git history.
`index.js` pauses these clips and shows controls for reduced-motion visitors.

# Player libraries

Run `npm ci` and `npm run build` to refresh the local player libraries in
`assets/vendor`. Their licenses are shipped alongside the scripts. No external
player API is fetched at page load; YouTube's API loads on interaction only.
