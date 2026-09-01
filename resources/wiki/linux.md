# Modding Skyrim on Linux

> This guide was written for us by **Madissien**. Thank you, it would not exist without her.

Skyrim and other Windows games run well on Linux, but the setup is different from Windows. This guide covers what you need and how to get a Wabbajack modlist running.

For newcomers we recommend a Linux distribution that specialises in gaming, for example **Nobara** or **Bazzite**. These ship with the necessary applications and game-ready drivers already installed.

> This is written for Skyrim, but it works as a general guideline for other games too.

> For the general Lumina requirements and pre-installation steps, see the [Read Me](readme.html?list=lumina). This guide only covers what is different on Linux.

## Before you start

Install Skyrim on your **SSD** and launch it at least once before doing anything else. The game needs to create its configuration files.

## What you need

Four tools cover everything: Proton to run the game, GOverlay for graphics features, and either Amethyst or Jackify depending on how you mod.

### Proton

A compatibility layer that lets Windows software, primarily games, run on Linux.

There are several versions of Proton and not all of them ship with Steam. To get the one you want, install it through the **ProtonPlus** application.

- Use **Proton-CachyOS** or **Proton GE**. Always pick the `latest` build.
- Anything below Proton **10-4** is not compatible with common ENBs and will not run the game smoothly.
- Our recommendation is **Proton-CachyOS**.

To select it, right-click Skyrim in Steam and choose **Properties**, open **Compatibility**, tick *Force the use of a specific Steam Play compatibility tool*, then pick your Proton version from the dropdown.

### GOverlay

A Qt6 GUI that puts performance and visual tooling behind an easy interface. It is usually pre-installed on gaming distributions. Nvidia, Mesa, AMD and Intel are all supported.

This is what lets you use modern graphics features such as **Community Shaders** without meaningful restrictions.

1. Select your game and enable **OptiScaler**.
2. Select **OptiPatcher** and the matching Nvidia or AMD option.
3. Enable **EnvVars**, then tick *Enable Wayland* and *Enable HDR*.
4. Save the configuration.
5. To the left of the save icon there is a command line. Copy its contents.
6. In Steam, right-click Skyrim, open **Properties** then **General**, and paste it into **Launch Options**.

> Keep that command line somewhere. You need to paste it again for the modlist itself.

### Amethyst

A native Linux mod manager supporting a variety of games, including installing Nexus collections. Follow its installation guide if you want to mod manually.

### Jackify

A Linux application for installing and configuring **Wabbajack** modlists on Linux and the Steam Deck. Follow its installation instructions and select the modlist you want. This is the one you need for Lumina.

## Installing a Wabbajack modlist

Install every tool above **except Amethyst**. Amethyst is for manual modding and is not used here. Use **Jackify** to download and install the modlist itself.

### Before launching the modlist

Once Jackify has finished installing, the modlist appears in Steam as its own entry. Configure it the same way you configured Skyrim.

1. Right-click the installed modlist in Steam and open **General**.
2. Disable *Enable the Steam Overlay while in-game*.
3. Paste the command line you copied from GOverlay into **Launch Options**.
4. Open **Compatibility** and select your Proton version, exactly as you did for Skyrim.

### Disable the incompatible mod

Launch the modlist, then in the Mod Organizer 2 search bar type:

```
Skyrim Priority SE AE
```

Find **Skyrim Priority SE AE - CPU Performance FPS Optimizer** and disable it.

> [!WARNING]
> This mod is not compatible with Linux. Leaving it enabled will cause problems.

### In game

If you get stuttering while playing, open **Community Shaders** and tune the relevant features to suit your hardware.
