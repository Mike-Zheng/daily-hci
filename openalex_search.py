"""OpenAlex Research Tool — Search 250M+ academic works without API key."""
import requests
import argparse
import json

BASE_URL = "https://api.openalex.org"

def search_works(topic, top=5, sort="cited_by_count:desc"):
    response = requests.get(f"{BASE_URL}/works", params={
        "search": topic, "per_page": top, "sort": sort
    })
    data = response.json()
    print(f"\n📚 Found {data['meta']['count']:,} papers for '{topic}'\n")
    for work in data["results"]:
        print(f"[{work['publication_year']}] {work['title']}")
        print(f"  Citations: {work['cited_by_count']:,} | DOI: {work.get('doi', 'N/A')}")
        print()

def search_authors(topic, top=5):
    response = requests.get(f"{BASE_URL}/authors", params={
        "search": topic, "sort": "cited_by_count:desc", "per_page": top
    })
    print(f"\n👤 Top authors for '{topic}':\n")
    for author in response.json()["results"]:
        inst = author.get("last_known_institutions", [{}])
        inst_name = inst[0]["display_name"] if inst else "Unknown"
        print(f"{author['display_name']} ({inst_name})")
        print(f"  {author['works_count']:,} works | {author['cited_by_count']:,} citations")
        print()

def trend_analysis(topic):
    response = requests.get(f"{BASE_URL}/works", params={
        "search": topic, "group_by": "publication_year"
    })
    print(f"\n📈 Publication trend for '{topic}':\n")
    groups = sorted(response.json()["group_by"], key=lambda g: g["key"])
    for g in groups:
        if int(g["key"]) >= 2018:
            bar = "█" * (g["count"] // 500)
            print(f"{g['key']}: {g['count']:>8,} papers {bar}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Search OpenAlex academic database")
    parser.add_argument("--topic", required=True, help="Research topic to search")
    parser.add_argument("--top", type=int, default=5, help="Number of results")
    parser.add_argument("--mode", choices=["papers", "authors", "trends", "all"], default="all")
    args = parser.parse_args()
    
    if args.mode in ("papers", "all"):
        search_works(args.topic, args.top)
    if args.mode in ("authors", "all"):
        search_authors(args.topic, args.top)
    if args.mode in ("trends", "all"):
        trend_analysis(args.topic)