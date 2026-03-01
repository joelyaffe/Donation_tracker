#!/usr/bin/env python3
"""
Apple Music Playlist Duplicate Remover

Reads a playlist exported as CSV or plain text, identifies duplicate songs,
and writes a de-duplicated version. Also generates a "removal list" you can
use to manually clean your playlist in the Apple Music app.

Supported input formats:
  1. CSV with columns: Title, Artist, Album, Duration (or any subset)
  2. Plain text with one "Artist - Title" or "Title" per line

Usage:
  python3 remove_playlist_duplicates.py <input_file> [-o output_file] [--dry-run]

Examples:
  python3 remove_playlist_duplicates.py my_playlist.csv
  python3 remove_playlist_duplicates.py my_playlist.csv -o clean_playlist.csv
  python3 remove_playlist_duplicates.py my_playlist.txt --dry-run
"""

import argparse
import csv
import os
import re
import sys
from collections import defaultdict
from pathlib import Path


def normalize(text: str) -> str:
    """Normalize a string for fuzzy comparison.

    Lowercases, strips whitespace, removes common suffixes like
    '(feat. …)', '(Remastered)', and non-alphanumeric characters.
    """
    text = text.lower().strip()
    # Remove parenthetical annotations: (feat. ...), (Remastered 2023), (Deluxe), etc.
    text = re.sub(r"\(.*?\)", "", text)
    # Remove bracket annotations: [feat. ...], [Live], etc.
    text = re.sub(r"\[.*?\]", "", text)
    # Collapse to alphanumeric + spaces
    text = re.sub(r"[^a-z0-9\s]", "", text)
    # Collapse multiple spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text


def read_csv_playlist(filepath: str) -> list[dict]:
    """Read a CSV playlist file and return a list of song dicts."""
    songs = []
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            return songs
        # Map common header variations
        field_map = {}
        for field in reader.fieldnames:
            lower = field.lower().strip()
            if lower in ("title", "name", "song", "track", "song name", "track name"):
                field_map["title"] = field
            elif lower in ("artist", "artist name", "band"):
                field_map["artist"] = field
            elif lower in ("album", "album name"):
                field_map["album"] = field
            elif lower in ("duration", "time", "length"):
                field_map["duration"] = field

        for i, row in enumerate(reader):
            song = {
                "line_number": i + 2,  # +2 for 1-indexed + header row
                "title": row.get(field_map.get("title", ""), "").strip(),
                "artist": row.get(field_map.get("artist", ""), "").strip(),
                "album": row.get(field_map.get("album", ""), "").strip(),
                "duration": row.get(field_map.get("duration", ""), "").strip(),
                "raw": row,
            }
            if song["title"]:
                songs.append(song)
    return songs


def read_text_playlist(filepath: str) -> list[dict]:
    """Read a plain text playlist (one song per line)."""
    songs = []
    with open(filepath, encoding="utf-8-sig") as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            # Try "Artist - Title" format
            if " - " in line:
                parts = line.split(" - ", maxsplit=1)
                song = {
                    "line_number": i,
                    "artist": parts[0].strip(),
                    "title": parts[1].strip(),
                    "album": "",
                    "duration": "",
                    "raw": line,
                }
            else:
                song = {
                    "line_number": i,
                    "title": line,
                    "artist": "",
                    "album": "",
                    "duration": "",
                    "raw": line,
                }
            songs.append(song)
    return songs


def detect_format(filepath: str) -> str:
    """Detect whether a file is CSV or plain text."""
    ext = Path(filepath).suffix.lower()
    if ext in (".csv", ".tsv"):
        return "csv"

    # Peek at first few lines for comma-separated structure
    with open(filepath, encoding="utf-8-sig") as f:
        first_lines = [f.readline() for _ in range(3)]

    # If lines consistently have commas, treat as CSV
    comma_counts = [line.count(",") for line in first_lines if line.strip()]
    if comma_counts and all(c >= 2 for c in comma_counts):
        return "csv"

    return "text"


def find_duplicates(songs: list[dict]) -> tuple[list[dict], list[list[dict]]]:
    """Find duplicate songs. Returns (unique_songs, groups_of_duplicates).

    Two songs are considered duplicates if their normalized title matches AND:
      - at least one has no artist, OR
      - their normalized artists also match.
    """
    # Group by normalized title
    by_title = defaultdict(list)
    for song in songs:
        key = normalize(song["title"])
        if key:
            by_title[key].append(song)

    unique = []
    duplicate_groups = []
    seen_titles = set()

    for song in songs:
        key = normalize(song["title"])
        if not key:
            unique.append(song)
            continue

        group = by_title[key]
        if len(group) <= 1:
            unique.append(song)
            continue

        # Further refine: group by normalized artist within the title group
        artist_key = normalize(song.get("artist", ""))
        full_key = (key, artist_key)

        if full_key not in seen_titles:
            seen_titles.add(full_key)
            unique.append(song)
            # Collect the duplicate group for reporting
            group_for_key = [
                s for s in group if normalize(s.get("artist", "")) == artist_key
            ]
            if len(group_for_key) > 1:
                duplicate_groups.append(group_for_key)
        # else: it's a duplicate, skip it

    return unique, duplicate_groups


def write_csv_output(songs: list[dict], filepath: str, fieldnames: list[str]) -> None:
    """Write de-duplicated songs back to CSV."""
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for song in songs:
            writer.writerow(song["raw"])


def write_text_output(songs: list[dict], filepath: str) -> None:
    """Write de-duplicated songs back to text."""
    with open(filepath, "w", encoding="utf-8") as f:
        for song in songs:
            f.write(str(song["raw"]) + "\n")


def write_removal_list(duplicate_groups: list[list[dict]], filepath: str) -> None:
    """Write a human-readable checklist of duplicates to remove.

    This file is designed to be opened on an iPad (e.g. in Notes or Files)
    so the user can work through their playlist and delete each duplicate.
    """
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("SONGS TO REMOVE FROM YOUR PLAYLIST\n")
        f.write("=" * 50 + "\n")
        f.write("Open your playlist in Apple Music, find each song\n")
        f.write("below, and swipe left → Delete (keep the first copy).\n\n")

        total_to_remove = 0
        for i, group in enumerate(duplicate_groups, start=1):
            removed = group[1:]
            total_to_remove += len(removed)
            f.write(f"--- Duplicate #{i} ---\n")
            song = group[0]
            if song["artist"]:
                f.write(f"  Song:   {song['title']}\n")
                f.write(f"  Artist: {song['artist']}\n")
            else:
                f.write(f"  Song: {song['title']}\n")
            if song["album"]:
                f.write(f"  Album:  {song['album']}\n")
            f.write(f"  Copies: {len(group)} (remove {len(removed)})\n")
            for r in removed:
                f.write(f"  [ ] Remove extra copy (was at position {r['line_number']})\n")
            f.write("\n")

        f.write(f"Total songs to remove: {total_to_remove}\n")


def format_song(song: dict) -> str:
    """Human-readable representation of a song."""
    parts = []
    if song["artist"]:
        parts.append(song["artist"])
    if song["title"]:
        parts.append(song["title"])
    label = " - ".join(parts) if parts else "(unknown)"
    if song["album"]:
        label += f'  [{song["album"]}]'
    return label


def main():
    parser = argparse.ArgumentParser(
        description="Find and remove duplicate songs from an Apple Music playlist export."
    )
    parser.add_argument("input_file", help="Path to the playlist file (CSV or text)")
    parser.add_argument(
        "-o",
        "--output",
        help="Path for the de-duplicated output file (default: <input>_clean.<ext>)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only report duplicates; don't write an output file",
    )
    parser.add_argument(
        "--removal-list",
        help="Write a checklist of duplicates to remove (text file you can reference on your iPad)",
    )
    args = parser.parse_args()

    if not os.path.isfile(args.input_file):
        print(f"Error: file not found: {args.input_file}", file=sys.stderr)
        sys.exit(1)

    fmt = detect_format(args.input_file)
    print(f"Detected format: {fmt.upper()}")

    if fmt == "csv":
        songs = read_csv_playlist(args.input_file)
    else:
        songs = read_text_playlist(args.input_file)

    if not songs:
        print("No songs found in the input file.")
        sys.exit(0)

    print(f"Total songs in playlist: {len(songs)}")

    unique_songs, duplicate_groups = find_duplicates(songs)
    total_dupes = len(songs) - len(unique_songs)

    if total_dupes == 0:
        print("\nNo duplicates found! Your playlist is already clean.")
        sys.exit(0)

    print(f"Duplicates found: {total_dupes}")
    print(f"Unique songs: {len(unique_songs)}")
    print()

    # Report duplicate groups
    print("=" * 60)
    print("DUPLICATE GROUPS")
    print("=" * 60)
    for i, group in enumerate(duplicate_groups, start=1):
        print(f"\n  Group {i}: {format_song(group[0])}")
        print(f"  Appears {len(group)} times (lines: {', '.join(str(s['line_number']) for s in group)})")
        kept = group[0]
        removed = group[1:]
        print(f"    Keeping:  line {kept['line_number']}: {format_song(kept)}")
        for r in removed:
            print(f"    Removing: line {r['line_number']}: {format_song(r)}")
    print()

    # Write removal checklist if requested
    removal_list_path = args.removal_list
    if not removal_list_path and not args.dry_run:
        p = Path(args.input_file)
        removal_list_path = str(p.with_stem(p.stem + "_to_remove").with_suffix(".txt"))

    if removal_list_path:
        write_removal_list(duplicate_groups, removal_list_path)
        print(f"Removal checklist written to: {removal_list_path}")
        print("  -> Open this file on your iPad to see exactly which duplicates to delete.\n")

    if args.dry_run:
        print("(Dry run — no clean playlist file written.)")
        sys.exit(0)

    # Determine output path
    if args.output:
        output_path = args.output
    else:
        p = Path(args.input_file)
        output_path = str(p.with_stem(p.stem + "_clean"))

    if fmt == "csv":
        # Preserve original CSV column names
        with open(args.input_file, newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames or []
        write_csv_output(unique_songs, output_path, fieldnames)
    else:
        write_text_output(unique_songs, output_path)

    print(f"Clean playlist written to: {output_path}")
    print(f"Removed {total_dupes} duplicate(s), kept {len(unique_songs)} unique song(s).")
    print()
    print("=" * 60)
    print("HOW TO CLEAN YOUR iPAD PLAYLIST")
    print("=" * 60)
    print()
    print("Option A — Manual removal (easiest, no extra tools):")
    print("  1. Open the removal checklist file on your iPad")
    print("     (AirDrop it, email it, or save to iCloud Drive)")
    print("  2. Open your playlist in Apple Music")
    print("  3. For each song in the checklist, find the extra copy")
    print("     in your playlist, swipe left, and tap Delete")
    print()
    print("Option B — Rebuild via Shortcuts app (automated):")
    print("  1. On your iPad, open the Shortcuts app")
    print("  2. Create a new shortcut with these steps:")
    print("     a. 'Get Playlist' → select your playlist")
    print("     b. 'Remove Duplicates' (filter by Name + Artist)")
    print("     c. 'Create Playlist' → save as a new playlist")
    print("  Or search the Shortcuts Gallery for 'Remove Duplicate Songs'")
    print()
    print("Option C — Rebuild on Mac (if you have one):")
    print("  1. Open Music app on your Mac")
    print("  2. File → Library → Import Playlist...")
    print("     (supports .m3u, .xml, and .txt formats)")
    print("  3. The playlist syncs to your iPad via iCloud Music Library")


if __name__ == "__main__":
    main()
