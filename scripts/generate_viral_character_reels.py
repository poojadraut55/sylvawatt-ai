#!/usr/bin/env python3
"""
SylvaWatt AI — Viral Multi-Character Speaking Reels Generator
Generates vertical 9:16 (1080x1920) viral social reels featuring speaking AI characters
powered by offline Kokoro-82M voices, real-time RMS audio-reactive mouth/waveform animation,
kinetic subtitles, live dashboard cursor-zoom views, and DevOps Invent branding.

Copyright 2026 DevOps Invent Private Limited. Licensed under DISA-NC 1.0.
"""
import argparse
import json
import math
import os
import platform
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO_ROOT = Path(__file__).resolve().parent.parent
CHAR_DIR = REPO_ROOT / "public" / "assets" / "characters"
SHOT_DIR = REPO_ROOT / "docs" / "screenshots"
MARK_PATH = REPO_ROOT / "public" / "img" / "mark.png"
DEFAULT_OUT_DIR = Path(
    os.environ.get(
        "SYLVAWATT_REELS_OUT",
        "/Users/deepakraut/Documents/ai-os/devopsinvent/assets/sylvawatt/video"
        if Path("/Users/deepakraut/Documents/ai-os/devopsinvent/assets/sylvawatt").exists()
        else str(REPO_ROOT / "output" / "reels"),
    )
)
AUDIO_CACHE_DIR = DEFAULT_OUT_DIR.parent / "audio_characters" if DEFAULT_OUT_DIR.name == "video" else DEFAULT_OUT_DIR / "audio"

CHARACTERS = {
    "sylva": {
        "name": "SYLVA AI",
        "role": "Nature & Water Guardian",
        "image": CHAR_DIR / "sylva_guardian.png",
        "voice": "af_heart",
        "lang": "a",
        "speed": 0.96,
        "accent": (52, 211, 153),
        "bg": (10, 34, 26),
        "mouth_center": (0.50, 0.505),
    },
    "liam": {
        "name": "LIAM NODE-X",
        "role": "Home RTX PC Owner",
        "image": CHAR_DIR / "liam_gamer_node.png",
        "voice": "am_liam",
        "lang": "a",
        "speed": 0.96,
        "accent": (56, 189, 248),
        "bg": (12, 26, 44),
        "mouth_center": (0.56, 0.54),
    },
    "megacloud": {
        "name": "MEGACLOUD BOT",
        "role": "Big Tech Data Center",
        "image": CHAR_DIR / "megacloud_bot.png",
        "voice": "am_onyx",
        "lang": "a",
        "speed": 0.94,
        "accent": (251, 146, 60),
        "bg": (40, 18, 14),
        "mouth_center": (0.55, 0.55),
    },
}

REEL_SPECS = [
    {
        "id": "reel_ai_1_gamer_vs_patent",
        "filename": "reel_ai_1_gamer_vs_patent_1080x1920.mp4",
        "hook_tag": "AI CHARACTERS DEBATE",
        "hook_title": "MICROSOFT PATENTED YOUR GAMING PC?",
        "cast": ["megacloud", "liam", "sylva"],
        "screenshot": "03_gaming_autopilot_pause.png",
        "alt_screenshot": "02_telemetry_controls.png",
        "caption_social": (
            "AI Characters Debate Big Tech's idle-GPU patent vs human ownership! "
            "With SylvaWatt AI (open-source), keep 88% net cash profit, hard thermal limits, "
            "<200ms gaming auto-pause & save 2.45L+ fresh water per GPU-hr."
        ),
        "turns": [
            {
                "speaker": "megacloud",
                "screenshot": "01_login_onboarding.png",
                "crop": [(0, 0, 1440, 900), (140, 80, 1160, 725)],
                "cursor": [(0.45, 0.45), (0.68, 0.38)],
                "text": "Big Tech patented renting your gaming PC while you sleep. We pay you in store credits!",
            },
            {
                "speaker": "liam",
                "screenshot": "03_gaming_autopilot_pause.png",
                "crop": [(0, 0, 1440, 900), (220, 0, 1120, 700)],
                "cursor": [(0.6, 0.25), (0.35, 0.14)],
                "text": "Wait — ten bucks of electricity and heat on MY RTX 4090 just for coupons? No chance!",
            },
            {
                "speaker": "sylva",
                "screenshot": "02_telemetry_controls.png",
                "crop": [(80, 60, 1280, 800), (200, 150, 1080, 675)],
                "cursor": [(0.35, 0.45), (0.72, 0.56)],
                "text": "Take back control with SylvaWatt AI! Keep 88 percent real cash payouts, strict temperature caps, and instant gaming auto-pause.",
            },
            {
                "speaker": "liam",
                "screenshot": "08_opensource_human_pledge.png",
                "crop": [(60, 40, 1320, 825), (180, 90, 1080, 675)],
                "cursor": [(0.5, 0.55), (0.5, 0.35)],
                "text": "Human power over AI! Clone SylvaWatt open-source right now on GitHub.",
            },
        ],
    },
    {
        "id": "reel_ai_2_water_scarcity_debate",
        "filename": "reel_ai_2_water_scarcity_debate_1080x1920.mp4",
        "hook_tag": "SAVE FRESH WATER",
        "hook_title": "WHY AI DATA CENTERS DRINK RIVERS",
        "cast": ["megacloud", "sylva", "liam"],
        "screenshot": "06_water_scarcity_movement.png",
        "alt_screenshot": "05_enterprise_compute_bridge.png",
        "caption_social": (
            "Hyperscale AI cooling towers evaporate fresh water daily. Watch Sylva AI & Node-X explain "
            "how shifting workloads onto idle home PCs saves 2.45L+ fresh water per GPU-hr & cuts cloud cost 58%!"
        ),
        "turns": [
            {
                "speaker": "megacloud",
                "screenshot": "06_water_scarcity_movement.png",
                "crop": [(0, 0, 1440, 900), (140, 120, 1180, 738)],
                "cursor": [(0.45, 0.35), (0.65, 0.52)],
                "text": "Mega AI clusters need huge evaporative cooling towers burning millions of gallons of water every day.",
            },
            {
                "speaker": "sylva",
                "screenshot": "06_water_scarcity_movement.png",
                "crop": [(140, 120, 1180, 738), (220, 180, 1060, 662)],
                "cursor": [(0.5, 0.45), (0.55, 0.68)],
                "text": "Why drain fresh drinking water when millions of home desktops sit idle overnight?",
            },
            {
                "speaker": "liam",
                "screenshot": "05_enterprise_compute_bridge.png",
                "crop": [(0, 0, 1440, 900), (140, 100, 1140, 712)],
                "cursor": [(0.4, 0.4), (0.78, 0.48)],
                "text": "SylvaWatt runs encrypted AI shards across home PCs — slashing startup cloud costs by fifty-eight percent!",
            },
            {
                "speaker": "sylva",
                "screenshot": "08_opensource_human_pledge.png",
                "crop": [(60, 40, 1320, 825), (200, 100, 1060, 662)],
                "cursor": [(0.5, 0.5), (0.52, 0.38)],
                "text": "Protect Earth's water and keep AI in human hands. Join the open-source movement at devopsinvent dot org.",
            },
        ],
    },
    {
        "id": "reel_ai_3_upgrade_security_power",
        "filename": "reel_ai_3_upgrade_security_power_1080x1920.mp4",
        "hook_tag": "MORE POWER = MORE INCOME",
        "hook_title": "UPGRADE YOUR RIG SAFELY FOR AI",
        "cast": ["liam", "sylva", "megacloud"],
        "screenshot": "04_earnings_upgrade_advisor.png",
        "alt_screenshot": "07_hardware_security_ads_hub.png",
        "caption_social": (
            "More PC power = higher AI income tiers — with Zero-Trust firewall isolation! "
            "Simulate +32GB RAM or RTX 4090 ROI payback inside SylvaWatt AI (DISA-NC 1.0 open-source)."
        ),
        "turns": [
            {
                "speaker": "liam",
                "screenshot": "04_earnings_upgrade_advisor.png",
                "crop": [(0, 0, 1440, 900), (420, 100, 1000, 625)],
                "cursor": [(0.45, 0.5), (0.72, 0.68)],
                "text": "If I add thirty-two gigs of RAM or upgrade my GPU, how much extra net cash can my home rig earn?",
            },
            {
                "speaker": "sylva",
                "screenshot": "04_earnings_upgrade_advisor.png",
                "crop": [(420, 100, 1000, 625), (480, 140, 940, 588)],
                "cursor": [(0.6, 0.45), (0.76, 0.72)],
                "text": "SylvaWatt calculates your real kilowatt-hour power cost and exact ROI payback, unlocking seventy-billion model tiers!",
            },
            {
                "speaker": "megacloud",
                "screenshot": "07_hardware_security_ads_hub.png",
                "crop": [(0, 0, 1440, 900), (160, 120, 1140, 712)],
                "cursor": [(0.45, 0.4), (0.55, 0.58)],
                "text": "Wait — isn't running outside AI workloads risky on a home internet router?",
            },
            {
                "speaker": "sylva",
                "screenshot": "07_hardware_security_ads_hub.png",
                "crop": [(160, 120, 1140, 712), (240, 180, 1040, 650)],
                "cursor": [(0.45, 0.55), (0.48, 0.66)],
                "text": "Every job stays inside Zero-Trust sandboxes with no LAN access. Star and clone poojadraut55 sylvawatt-ai on GitHub!",
            },
        ],
    },
]


def load_font(size: int, bold: bool = True):
    candidates = (
        [
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ]
        if bold
        else [
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
    )
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    words = text.split()
    lines, cur = [], []
    for w in words:
        trial = " ".join(cur + [w])
        bbox = draw.textbbox((0, 0), trial, font=font)
        if bbox[2] - bbox[0] <= max_width or not cur:
            cur.append(w)
        else:
            lines.append(" ".join(cur))
            cur = [w]
    if cur:
        lines.append(" ".join(cur))
    return lines[:3]


def synthesize_turn_wav(text: str, char_cfg: dict, wav_path: Path, pipelines: dict) -> float:
    wav_path.parent.mkdir(parents=True, exist_ok=True)
    if not wav_path.exists():
        try:
            from kokoro import KPipeline

            key = char_cfg["lang"]
            if key not in pipelines:
                pipelines[key] = KPipeline(lang_code=key)
            chunks = []
            for _gs, _ps, audio in pipelines[key](text, voice=char_cfg["voice"], speed=char_cfg["speed"]):
                chunks.append(audio)
            combined = np.concatenate(chunks)
            # Pad tiny 0.18s natural breath gap at end of turn
            silence = np.zeros(int(24000 * 0.18), dtype=np.float32)
            sf.write(str(wav_path), np.concatenate([combined, silence]), 24000)
        except Exception as exc:
            if platform.system() == "Darwin":
                aiff_tmp = wav_path.with_suffix(".aiff")
                subprocess.run(["say", "-o", str(aiff_tmp), text], check=True)
                subprocess.run(["ffmpeg", "-y", "-i", str(aiff_tmp), "-ar", "24000", "-ac", "1", str(wav_path)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                aiff_tmp.unlink(missing_ok=True)
            else:
                raise RuntimeError(f"Voice synthesis failed: {exc}")

    with wave.open(str(wav_path), "rb") as wf:
        return wf.getnframes() / float(wf.getframerate())


def compute_frame_energies(audio_data: np.ndarray, sample_rate: int, fps: int, n_frames: int) -> list[float]:
    samples_per_frame = max(1, int(sample_rate / fps))
    energies = []
    peak = max(0.01, float(np.percentile(np.abs(audio_data), 98)))
    for i in range(n_frames):
        s0 = i * samples_per_frame
        s1 = min(len(audio_data), s0 + samples_per_frame)
        if s0 >= len(audio_data):
            energies.append(0.0)
        else:
            rms = float(np.sqrt(np.mean(np.square(audio_data[s0:s1]))))
            energies.append(min(1.0, rms / (peak * 0.65)))
    return energies


def build_combined_track(turns: list[dict], reel_id: str, fps: int = 30) -> tuple[Path, list[dict]]:
    pipelines = {}
    audio_parts = []
    timeline = []
    cursor_t = 0.0
    sr = 24000

    for idx, turn in enumerate(turns):
        cfg = CHARACTERS[turn["speaker"]]
        wav_path = AUDIO_CACHE_DIR / f"{reel_id}_turn_{idx}_{turn['speaker']}.wav"
        dur = synthesize_turn_wav(turn["text"], cfg, wav_path, pipelines)
        data, file_sr = sf.read(str(wav_path), dtype="float32")
        if data.ndim > 1:
            data = np.mean(data, axis=1)
        sr = file_sr
        audio_parts.append(data)
        n_frames = max(1, int(round(dur * fps)))
        energies = compute_frame_energies(data, sr, fps, n_frames)
        timeline.append(
            {
                **turn,
                "start": cursor_t,
                "end": cursor_t + dur,
                "energies": energies,
            }
        )
        cursor_t += dur

    full_audio = np.concatenate(audio_parts)
    master_wav = AUDIO_CACHE_DIR / f"{reel_id}_master.wav"
    sf.write(str(master_wav), full_audio, sr)
    return master_wav, timeline


def load_character_pod_img(char_id: str, size: int) -> Image.Image:
    im = Image.open(CHARACTERS[char_id]["image"]).convert("RGB").resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, size, size], radius=38, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def render_reel(spec: dict, out_dir: Path = DEFAULT_OUT_DIR, preview_only: bool = False) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    W, H, FPS = 1080, 1920, 30

    master_wav, timeline = build_combined_track(spec["turns"], spec["id"], fps=FPS)
    total_dur = timeline[-1]["end"]
    total_frames = 1 if preview_only else int(math.ceil(total_dur * FPS))

    out_path = out_dir / (f"preview_{spec['id']}.png" if preview_only else spec["filename"])
    print(f"🎬 Rendering {spec['id']} ({total_dur:.1f}s, {total_frames} frames) -> {out_path}")

    f_hook_tag = load_font(24, True)
    f_hook_title = load_font(38, True)
    f_brand = load_font(28, True)
    f_sub_sm = load_font(22, False)
    f_speaker = load_font(26, True)
    f_caption = load_font(34, True)
    f_cta = load_font(24, True)

    mark_img = Image.open(MARK_PATH).convert("RGBA").resize((42, 42), Image.Resampling.LANCZOS)
    shots_cache, bg_cache = {}, {}
    for t_item in timeline:
        sn = t_item["screenshot"]
        if sn not in shots_cache:
            im = Image.open(SHOT_DIR / sn).convert("RGB")
            shots_cache[sn] = im
            blur = im.resize((W, H)).filter(ImageFilter.GaussianBlur(34))
            tint = Image.new("RGBA", (W, H), (6, 14, 14, 215))
            blur.paste(tint, (0, 0), tint)
            bg_cache[sn] = blur

    cast_ids = spec["cast"]
    pod_base_size = 278 if len(cast_ids) == 3 else 330
    pod_imgs = {cid: load_character_pod_img(cid, pod_base_size) for cid in cast_ids}

    pipe = None
    if not preview_only:
        codec = "h264_videotoolbox" if platform.system() == "Darwin" else "libx264"
        cmd = [
            "ffmpeg", "-y", "-f", "rawvideo", "-vcodec", "rawvideo", "-s", f"{W}x{H}",
            "-pix_fmt", "rgb24", "-r", str(FPS), "-i", "-", "-i", str(master_wav),
            "-c:v", codec, "-b:v", "4M", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-shortest", str(out_path),
        ]
        pipe = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    win_x, win_y, win_w, win_h, tb_h = 46, 250, 988, 700, 44
    vp_w, vp_h = win_w - 8, win_h - tb_h - 4

    for idx in range(total_frames):
        t = idx / float(FPS)
        cur = next((item for item in timeline if item["start"] <= t < item["end"]), timeline[-1])
        local_idx = min(len(cur["energies"]) - 1, max(0, int((t - cur["start"]) * FPS)))
        energy = cur["energies"][local_idx]
        u = max(0.0, min(1.0, (t - cur["start"]) / max(0.001, cur["end"] - cur["start"])))
        prog = u * u * (3 - 2 * u)

        canvas = bg_cache[cur["screenshot"]].copy()
        draw = ImageDraw.Draw(canvas)

        # 1. Top DevOps Invent Branding Pill
        draw.rounded_rectangle([54, 48, W - 54, 108], radius=28, fill=(10, 24, 22, 240), outline=(52, 211, 153), width=2)
        canvas.paste(mark_img, (72, 57), mark_img)
        draw.text((126, 62), "DEVOPS INVENT", font=f_brand, fill=(236, 253, 245))
        draw.text((386, 67), "•  SYLVAWATT AI CHARACTERS", font=f_sub_sm, fill=(110, 231, 183))

        # 2. Viral Hook Banner
        draw.rounded_rectangle([46, 122, W - 46, 234], radius=22, fill=(11, 22, 30, 248), outline=(56, 189, 248), width=3)
        draw.text((76, 134), f"[ {spec['hook_tag']} ]", font=f_hook_tag, fill=(56, 189, 248))
        draw.text((76, 170), spec["hook_title"], font=f_hook_title, fill=(248, 250, 252))

        # 3. Zoomed UI Showcase Window with Cursor Spotlight
        src = shots_cache[cur["screenshot"]]
        sw, sh = src.size
        cs, ce = cur["crop"]
        cx = max(0, min(sw - cs[2], cs[0] + (ce[0] - cs[0]) * prog))
        cy = max(0, min(sh - cs[3], cs[1] + (ce[1] - cs[1]) * prog))
        cw = cs[2] + (ce[2] - cs[2]) * prog
        ch = cs[3] + (ce[3] - cs[3]) * prog
        vp = src.crop((int(cx), int(cy), int(cx + cw), int(cy + ch))).resize((vp_w, vp_h), Image.Resampling.BICUBIC)

        draw.rounded_rectangle([win_x, win_y, win_x + win_w, win_y + win_h], radius=24, fill=(15, 23, 42), outline=(71, 85, 105), width=2)
        draw.ellipse([win_x + 20, win_y + 14, win_x + 34, win_y + 28], fill=(248, 113, 113))
        draw.ellipse([win_x + 42, win_y + 14, win_x + 56, win_y + 28], fill=(250, 204, 21))
        draw.ellipse([win_x + 64, win_y + 14, win_x + 78, win_y + 28], fill=(52, 211, 153))
        draw.text((win_x + 100, win_y + 11), "devopsinvent.org/demo/sylvawatt/", font=f_sub_sm, fill=(148, 163, 184))
        canvas.paste(vp, (win_x + 4, win_y + tb_h))

        # Cursor pulse over UI
        ks, ke = cur["cursor"]
        cur_px = int(win_x + 4 + (ks[0] + (ke[0] - ks[0]) * prog) * vp_w)
        cur_py = int(win_y + tb_h + (ks[1] + (ke[1] - ks[1]) * prog) * vp_h)
        pr = 18 + int(8 * math.sin(t * 8))
        draw.ellipse([cur_px - pr, cur_py - pr, cur_px + pr, cur_py + pr], outline=(52, 211, 153), width=3)
        draw.ellipse([cur_px - 7, cur_py - 7, cur_px + 7, cur_py + 7], fill=(52, 211, 153))

        # 4. Kinetic Speaker Caption Panel
        active_id = cur["speaker"]
        active_cfg = CHARACTERS[active_id]
        cap_y1, cap_y2 = 974, 1218
        draw.rounded_rectangle([46, cap_y1, W - 46, cap_y2], radius=24, fill=(9, 20, 24, 245), outline=active_cfg["accent"], width=3)
        # Dynamic-width Speaker Pill
        pill_txt = f"{active_cfg['name']} SPEAKING"
        pb = draw.textbbox((0, 0), pill_txt, font=f_cta)
        pill_w = (pb[2] - pb[0]) + 36
        draw.rounded_rectangle([72, cap_y1 + 16, 72 + pill_w, cap_y1 + 56], radius=14, fill=active_cfg["accent"])
        draw.text((90, cap_y1 + 22), pill_txt, font=f_cta, fill=(6, 14, 16))
        draw.text((72 + pill_w + 18, cap_y1 + 24), active_cfg["role"], font=f_sub_sm, fill=(148, 163, 184))

        lines = wrap_lines(draw, cur["text"], f_caption, W - 150)
        ly = cap_y1 + 74
        for line in lines:
            draw.text((76, ly), line, font=f_caption, fill=(248, 250, 252))
            ly += 44

        # 5. Speaking AI Characters Stage (Audio-Reactive Glow + Mouth Bar Visualizer)
        stage_y = 1260
        spacing = 36
        total_cast_w = len(cast_ids) * pod_base_size + (len(cast_ids) - 1) * spacing
        start_x = (W - total_cast_w) // 2

        for c_i, cid in enumerate(cast_ids):
            ccfg = CHARACTERS[cid]
            is_speaking = cid == active_id
            px = start_x + c_i * (pod_base_size + spacing)
            bob = int(-10 * energy * math.sin(t * 14 + c_i)) if is_speaking else 0
            py = stage_y + bob

            scale = 1.0 + (0.06 * (0.4 + 0.6 * energy) if is_speaking else -0.04)
            p_size = int(pod_base_size * scale)
            dx = px + (pod_base_size - p_size) // 2
            dy = py + (pod_base_size - p_size) // 2

            # Outer glowing aura when speaking
            if is_speaking:
                glow_pad = int(10 + 18 * energy)
                draw.rounded_rectangle(
                    [dx - glow_pad, dy - glow_pad, dx + p_size + glow_pad, dy + p_size + glow_pad],
                    radius=46,
                    outline=ccfg["accent"],
                    width=5,
                )
            else:
                draw.rounded_rectangle([dx - 3, dy - 3, dx + p_size + 3, dy + p_size + 3], radius=40, outline=(51, 65, 85), width=2)

            pod_scaled = pod_imgs[cid].resize((p_size, p_size), Image.Resampling.LANCZOS)
            if not is_speaking:
                # Dim inactive speaker gently so active character stands out
                arr = np.array(pod_scaled, dtype=np.float32)
                arr[..., :3] *= 0.52
                pod_scaled = Image.fromarray(arr.astype(np.uint8), "RGBA")
            canvas.paste(pod_scaled, (dx, dy), pod_scaled)

            # Audio-reactive LED equalizer bars directly inside the bottom visor / pod rim
            bar_count = 7
            eq_w = p_size - 70
            bar_w = max(8, eq_w // (bar_count * 2))
            bx0 = dx + (p_size - bar_count * bar_w * 2) // 2
            by_base = dy + p_size - 26
            for b in range(bar_count):
                wave_f = abs(math.sin(t * 18 + b * 0.9))
                bh = int((6 + 34 * energy * (0.45 + 0.55 * wave_f)) if is_speaking else 5)
                bx = bx0 + b * bar_w * 2
                color = ccfg["accent"] if is_speaking else (71, 85, 105)
                draw.rounded_rectangle([bx, by_base - bh, bx + bar_w, by_base], radius=3, fill=color)

            # Name plate under pod
            label_y = stage_y + pod_base_size + 24
            draw.rounded_rectangle([px + 12, label_y, px + pod_base_size - 12, label_y + 44], radius=14, fill=ccfg["bg"], outline=ccfg["accent"] if is_speaking else (51, 65, 85), width=2)
            nb = draw.textbbox((0, 0), ccfg["name"], font=f_speaker)
            nw = nb[2] - nb[0]
            draw.text((px + (pod_base_size - nw) // 2, label_y + 8), ccfg["name"], font=f_speaker, fill=(248, 250, 252) if is_speaking else (148, 163, 184))

        # 6. Bottom Call-To-Action Strip
        draw.rounded_rectangle([46, 1744, W - 46, 1846], radius=24, fill=(10, 30, 24, 245), outline=(52, 211, 153), width=2)
        draw.text((84, 1762), "Open Source (DISA-NC 1.0): github.com/poojadraut55/sylvawatt-ai", font=f_cta, fill=(110, 231, 183))
        draw.text((84, 1800), "Live Demo: devopsinvent.org/demo/sylvawatt/  |  Save 2.45L Water / GPU-hr", font=f_sub_sm, fill=(203, 213, 225))

        if preview_only:
            canvas.save(str(out_path))
            return out_path
        pipe.stdin.write(canvas.tobytes())

    if pipe is not None:
        pipe.stdin.close()
        ret = pipe.wait()
        if ret != 0:
            raise RuntimeError(f"FFmpeg exited with code {ret} for {out_path}")
    return out_path


def write_manifest(out_dir: Path):
    manifest = [
        {
            "id": r["id"],
            "filename": r["filename"],
            "hook_tag": r["hook_tag"],
            "hook_title": r["hook_title"],
            "cast": [CHARACTERS[c]["name"] for c in r["cast"]],
            "caption_social": r["caption_social"],
            "turns": r["turns"],
        }
        for r in REEL_SPECS
    ]
    mpath = REPO_ROOT / "data" / "viral-reels-manifest.json"
    mpath.parent.mkdir(parents=True, exist_ok=True)
    mpath.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Generate SylvaWatt AI Character-Speaking Viral Reels")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="Directory for output MP4 reels")
    parser.add_argument("--reel", default="all", help="Specific reel ID or 'all'")
    parser.add_argument("--preview", action="store_true", help="Render frame-0 PNG previews only")
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    write_manifest(out_dir)
    selected = REEL_SPECS if args.reel == "all" else [r for r in REEL_SPECS if r["id"] == args.reel]
    if not selected:
        raise SystemExit(f"Unknown reel ID: {args.reel}")
    for spec in selected:
        render_reel(spec, out_dir=out_dir, preview_only=args.preview)
    print(f"All requested AI character reels ready in {out_dir}")


if __name__ == "__main__":
    main()
