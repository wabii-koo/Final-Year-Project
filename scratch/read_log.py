import json

log_path = r"C:\Users\kumaa\.gemini\antigravity-ide\brain\b01dbdf9-158b-4e46-925b-dc157720131f\.system_generated\logs\transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        step = data.get("step_index", 0)
        if 38 <= step <= 64:
            print(f"=== Step {step} | Source: {data.get('source')} | Type: {data.get('type')} ===")
            content = data.get("content")
            if content:
                # Print first 500 chars if it's too long
                if len(content) > 1000:
                    print(content[:1000] + "\n... [TRUNCATED] ...")
                else:
                    print(content)
            if data.get("tool_calls"):
                print("Tool Calls:", data.get("tool_calls"))
            print("-" * 50)
