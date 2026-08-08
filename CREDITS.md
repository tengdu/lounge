# Image credits

## Photographs of specific lounges

These are real photographs of the lounge they are shown on. All are used under
free licenses that permit redistribution, including commercially. Attribution
below is required by those licenses — keep it in sync with
`LOUNGE_PHOTOS` in `scripts/lounge-sources.mjs`.

| Lounge | Photographer | License | Source |
|---|---|---|---|
| Delta Sky Club — SEA Concourse A (Gate A1) | Delta News Hub | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:The_new_Delta_Sky_Club_in_Seattle_(30367396621).jpg) |
| Delta Sky Club — SEA Concourse A (Gate A11) | Delta News Hub | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:The_new_Delta_Sky_Club_in_Seattle_(30156183840).jpg) |
| Alaska Lounge — SEA North Satellite | Zheng Zhou | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Alaska_Lounge_at_N_Concourse_of_Sea-Tac_Airport.jpg) |

Images are resized and converted to WebP by `scripts/optimize-images.mjs`;
no other modifications are made. EXIF metadata is stripped in that step.

The archived sources in `assets/lounges/real/` are downscaled to 2560px wide
rather than kept at full resolution — the site renders at most 1600px, and the
originals totalled 25MB, which is not worth carrying in git history forever.
Full-resolution files remain available from the source links above.

## Generic lounge art

Every other lounge uses generic interior art assigned per brand via
`BRAND_IMAGES`, so all lounges of one brand look alike. **These are not
photographs of the specific rooms** — the UI labels them accordingly.

## Adding a real photo

1. Confirm the license permits redistribution. Airline and card-issuer press
   photos generally do **not**, even when publicly downloadable. Wikimedia
   Commons is a reliable source; check each file's individual license.
2. Drop the source file in `assets/lounges/real/<name>.jpg`.
3. Map the lounge id to `<name>` in `LOUNGE_PHOTOS`
   (`scripts/lounge-sources.mjs`).
4. Add a row to the table above.
5. Run:

   ```bash
   node scripts/optimize-images.mjs
   node scripts/generate-lounges.mjs
   ```

The generator fails loudly if a `LOUNGE_PHOTOS` key matches no lounge id or if
a referenced image file is missing, so a typo cannot silently fall back to
generic art.
