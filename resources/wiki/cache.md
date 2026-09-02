# Cache

Part of **Rule 11**. Read this before you change anything that touches files on disk.

Lumina uses [Cached Recursive Directory Walk](https://www.nexusmods.com/skyrimspecialedition/mods/186434) to cache the game's directory scan. Anything that adds, removes or moves files means that cache is out of date.

Lumina ships with the mod's popup **disabled**, which puts the responsibility on you: with the popup off, nothing reminds you to rebuild. Re-generate the cache yourself after any change to the list.

## After reinstalling or updating the mod

A reinstall resets the popup to disabled. Open the config and turn it back on:

```
; Lumina\mods\Cached Recursive Directory Walk\SKSE\Plugins\CRDW.ini

[General]
ShowPopUp=b:true
```

Make sure the line sits under `[General]` and not under `[Optimization]`.

> [!WARNING]
> A stale cache makes the game load the wrong files. You will end up chasing bugs that do not exist.
