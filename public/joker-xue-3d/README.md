# joker-xue-3d (static embed)

Vite+R3F build from `kangning-huang/concert_viewing` branch `source`.

## Live
- https://kangning-huang.com/joker-xue-3d/wuxi/
- https://kangning-huang.com/joker-xue-3d/beijing/

## Rebuild
On the iMac source tree:

```bash
cd ~/Documents/repos/concert_viewing
git checkout source
VITE_BASE=/joker-xue-3d/wuxi/ npm run build
rsync -a --exclude='*.map' dist/ ~/Documents/repos/main/public/joker-xue-3d/wuxi/
VITE_BASE=/joker-xue-3d/beijing/ npm run build
rsync -a --exclude='*.map' dist/ ~/Documents/repos/main/public/joker-xue-3d/beijing/
# then commit + push kangning-huang/main (triggers Pages deploy)
```

Venue defaults from the URL path (`/wuxi` → Wuxi, `/beijing` → Nest). HUD can still switch venues.
