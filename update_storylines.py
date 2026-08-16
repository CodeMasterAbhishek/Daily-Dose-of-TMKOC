import scrapetube
import re
import csv
import os

def get_minutes(duration_str: str) -> int:
    parts = duration_str.split(':')
    if len(parts) == 3: # H:M:S
        return int(parts[0]) * 60 + int(parts[1])
    elif len(parts) == 2:
        return int(parts[0])
    return 0

def parse_relative_date(time_text: str) -> str:
    if not time_text:
        return ""
    return time_text

def extract_part_number(title: str) -> str:
    # Match "Part 1", "Part - 1", "Pt 1", "Pt. 1"
    match = re.search(r'(?i)part\s*[-.]?\s*(\d+)|pt\s*[-.]?\s*(\d+)', title)
    if match:
        num = match.group(1) if match.group(1) else match.group(2)
        return f"Part {num}"
    return ""

def main():
    print("=======================================================")
    print("  TMKOC Storylines Auto-Updater")
    print("=======================================================")
    
    valid_channels = ['sony sab', 'sony pal', 'taarak mehta ka ooltah chashmah', 'taarak mehta ka ooltah chashmah episodes']
    storylines = []
    
    csv_file = "storylines.csv"
    existing_urls = set()
    
    if os.path.exists(csv_file):
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 3:
                    existing_urls.add(row[2])
                    storylines.append(row)
    
    next_id = 1
    if storylines:
        try:
            next_id = int(storylines[-1][0]) + 1
        except:
            pass

    queries = [
        "Taarak Mehta Ka Ooltah Chashmah Full Movie",
        "Taarak Mehta Ka Ooltah Chashmah Story"
    ]
    
    new_count = 0
    
    for query in queries:
        print(f"Searching: '{query}'...")
        try:
            videos = scrapetube.get_search(query, sort_by="upload_date", limit=300)
            for vid in videos:
                channel = vid.get('ownerText', {}).get('runs', [{}])[0].get('text', '').lower()
                if channel not in valid_channels:
                    continue
                    
                title_runs = vid.get('title', {}).get('runs', [])
                title = "".join([r.get('text', '') for r in title_runs]).strip()
                
                vid_id = vid.get('videoId', '')
                if not vid_id:
                    continue
                    
                url = f"https://www.youtube.com/watch?v={vid_id}"
                if url in existing_urls:
                    continue
                    
                duration_str = vid.get('lengthText', {}).get('simpleText', '0:00')
                mins = get_minutes(duration_str)
                
                # Storylines must be at least 30 minutes long
                if mins < 30:
                    continue
                    
                time_text = vid.get('publishedTimeText', {}).get('simpleText', '')
                date_str = parse_relative_date(time_text)
                
                part_num = extract_part_number(title)
                
                print(f"  [FOUND] {title} ({duration_str}) - {part_num}")
                storylines.append([str(next_id), title, url, date_str, duration_str, part_num])
                existing_urls.add(url)
                next_id += 1
                new_count += 1
        except Exception as e:
            print(f"Error fetching: {e}")
            
    if new_count > 0:
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(storylines)
        print(f"\nSuccessfully added {new_count} new storylines!")
    else:
        print("\nNo new storylines found.")

if __name__ == "__main__":
    main()
