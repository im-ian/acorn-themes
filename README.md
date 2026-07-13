# Acorn Themes

[![Deploy theme previews](https://github.com/im-ian/acorn-themes/actions/workflows/pages.yml/badge.svg)](https://github.com/im-ian/acorn-themes/actions/workflows/pages.yml)

Downloadable themes for [Acorn](https://github.com/im-ian/acorn).

[Browse the live theme previews](https://im-ian.github.io/acorn-themes/)

Acorn reads `manifest.json` at runtime, then downloads a selected CSS file into
its local `themes` directory. Theme changes and new themes can therefore ship
without rebuilding Acorn.

## Adding or updating a theme

1. Add `themes/<id>.css`. The ID must use lowercase letters, numbers, and
   hyphens, and the CSS must target `data-acorn-theme="<id>"`.
2. Declare every required Acorn color variable. Existing themes are the most
   useful reference for the current contract.
3. Add the theme to `manifest.json`. Increment its `version` whenever its CSS
   changes so installed copies show an update in Acorn.

The four core themes remain bundled with Acorn and cannot be replaced by this
catalog: `acorn-dark`, `acorn-pink`, `acorn-light`, and `acorn-light-pink`.

Source palettes and licenses for adapted themes are recorded in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

The preview site reuses Acorn's packaged app icon and the same Lucide icon
paths used by Acorn's React interface so the mock workspace stays aligned with
the product UI.
