# Cache

Part of **Rule 11**. Read this before you change anything that touches files on disk.

## Rule 11 disclaimer

> [!WARNING]
> If you make any changes to the modlist, we cannot offer you help for issues that arise from it. Removing major game functions in the MCM that are not covered in the FAQ also counts towards Rule 11. Encouraging others to modify the list outside of the modification channels is considered Rule 11. VRAMr, DLSS and Lossless Scaling **are** Rule 11. Breaking Rule 11 and filing a report will have your access to the report channel removed permanently.

**Modifying the list voids support from the Lumina Discord team.** What that means in practice:

- **Do not** post messages in `#lumina-help`
- **Do not** ask for help outside `#rule-11`
- **Do not** vote on polls about performance or crashes
- **Do not** post bug reports

Following these guides should keep you safe from a stability point of view, but it **still counts as Rule 11**.

## Keeping the cache fresh

Lumina uses [Cached Recursive Directory Walk](https://www.nexusmods.com/skyrimspecialedition/mods/186434) to cache the game's directory scan. Anything that adds, removes or moves files means that cache is out of date.

Lumina ships with the mod's popup **disabled**, which puts the responsibility on you: with the popup off, nothing reminds you to rebuild. Re-generate the cache yourself after any change to the list.

## After reinstalling or updating the mod

A reinstall resets the popup to disabled. Open the config and turn it back on:

```
; Lumina\mods\Cached Recursive Directory Walk\SKSE\Plugins\CRDW.ini

[General]
ShowPopUp=b:true
```

Make sure the line sits under `[General]`.

> [!WARNING]
> A stale cache makes the game load the wrong files. You will end up chasing bugs that do not exist.