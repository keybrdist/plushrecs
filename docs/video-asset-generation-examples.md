# Video Asset Generation Examples for Releases

This document records **working ffmpeg commands** we used during the PLUSH ✧ Recordings _PLUSH123_ run (Aug 2025) to create various social-media-ready video formats from a single source recording.

> All commands are executed from the project workdir: `plushrecs/_workdir/PLUSH123/`.

## Source Files

| Purpose | File |
|---------|------|
| Raw video capture (no audio) | `Google Chrome - 24 August 2025.mp4` |
| Final mastered track (WAV)   | `PLUSH123/PLUSH123-2-Adred-Take_Me_To_92.wav` |

## 1. Full-Length Loop w/ Audio (`combined.mp4`)
Merge the WAV onto the video and loop the visuals until the track ends.

```bash
ffmpeg -y \
  -stream_loop -1 -i "Google Chrome - 24 August 2025.mp4" \
  -i "PLUSH123/PLUSH123-2-Adred-Take_Me_To_92.wav" \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k \
  -shortest combined.mp4
```

**What it does**
* `-stream_loop -1` — repeat video endlessly.
* `-map 0:v:0` — keep only the video stream from input 0.
* `-map 1:a:0` — take audio from the WAV.
* `-shortest` — stop when the audio track ends.
* Encodes audio to AAC for MP4 compatibility.

The output is saved to `final/combined.mp4` in our case.

## 2. Square 1:1 Crop (`combined_square.mp4`)
Center-crop the full-length render to a square.

```bash
ffmpeg -y -i final/combined.mp4 \
  -vf "crop='min(iw,ih)':'min(iw,ih)'" \
  -c:a copy final/combined_square.mp4
```

**Notes**
* Picks the smaller of width/height to keep a centered square.
* Audio stream is copied without re-encoding.

Useful for Instagram posts / Bandcamp display thumbnails.

## 3. Vertical 9:16 (1080×1920) (`combined_9x16.mp4`)
Create a TikTok/Reels-ready asset.

```bash
ffmpeg -y -i final/combined.mp4 \
  -vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920" \
  -c:a copy final/combined_9x16.mp4
```

**Explanation**
1. `crop=ih*9/16:ih:...` crops a central 9:16 slice based on the input height.
2. `scale=1080:1920` then resizes to standard 1080×1920.
3. Audio is again copied.

---

### Tips for Future Releases
* Keep raw video **without** embedded audio—this simplifies replacement.
* Store mastered audio in high-res WAV; encode to AAC/Opus during muxing.
* Maintain a `final/` folder per release to avoid clutter.
* Document new commands here for quick reference.

## 4. Silent 8-Second 9:16 Teaser (No Audio)
Generate a quick teaser loop – ideal for Stories or background loops where audio is unnecessary.

```bash
ffmpeg -y -stream_loop -1 -i "Google Chrome - 24 August 2025.mp4" \
  -vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920,setsar=1" \
  -t 8 -an final/katsh_teaser_9x16_8s_noaudio.mp4
```

The filter chain:
1. Center‐crop to 9:16 based on input height.
2. Scale to 1080 × 1920.
3. `setsar=1` forces a square pixel aspect ratio so display aspect is exactly 9:16.
4. `-t 8` trims to 8 seconds.
5. `-an` strips all audio.

### Fixing Platform Ratio Errors
Some platforms still flag videos if the Sample Aspect Ratio (SAR) metadata is off. The command below pads and re-sets SAR to guarantee compliance.

```bash
ffmpeg -y -stream_loop -1 -i "Google Chrome - 24 August 2025.mp4" \
  -vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920,setsar=1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -t 8 -an final/katsh_teaser_9x16_8s_noaudio_fixed.mp4
```

The extra `pad` guarantees final canvas is exactly 1080 × 1920 even after SAR reset.

---

_Last updated: 2025-08-24_

