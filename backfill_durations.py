import csv
import aiohttp
import asyncio
import re
import os

CSV_FILE = "episodes.csv"

def format_duration(seconds):
    seconds = int(seconds)
    m, s = divmod(seconds, 60)
    if m >= 60:
        h, m = divmod(m, 60)
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"

async def fetch_duration(session, sem, vid_id):
    url = f"https://www.youtube.com/watch?v={vid_id}"
    async with sem:
        try:
            async with session.get(url, timeout=10) as response:
                html = await response.text()
                match = re.search(r'"lengthSeconds":"(\d+)"', html)
                if match:
                    return format_duration(match.group(1))
        except Exception:
            pass
    return "21:45" # fallback

async def process_rows():
    if not os.path.exists(CSV_FILE):
        return

    with open(CSV_FILE, "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))

    tasks = []
    sem = asyncio.Semaphore(50) 
    
    async with aiohttp.ClientSession() as session:
        for i, row in enumerate(rows):
            if i == 0:
                continue
            
            if len(row) == 4:
                vid_url = row[2]
                vid_id = vid_url.split("v=")[-1].split("&")[0] if "v=" in vid_url else None
                if vid_id:
                    tasks.append((i, asyncio.create_task(fetch_duration(session, sem, vid_id))))

        if not tasks:
            print("No rows missing duration found.")
            return

        print(f"Backfilling {len(tasks)} missing durations...")
        completed = 0
        for i, task in tasks:
            duration = await task
            rows[i].append("") # Date
            rows[i].append(duration) # Duration
            
            completed += 1
            if completed % 100 == 0 or completed == len(tasks):
                print(f"Processed {completed}/{len(tasks)} videos...")
                with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
                    csv.writer(f).writerows(rows)

    print("Backfill complete!")

if __name__ == "__main__":
    asyncio.run(process_rows())
