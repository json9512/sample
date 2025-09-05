#!/usr/bin/env python3
import sys
import json

INSTRUCTIONS = (
    "You are an expert translator with exceptional skill on Korean-English translation.\n"
    "You must translate the given prompt to English first if the prompt is in Korean.\n"
    "You must not change the meaning of the original Korean prompt.\n"
)

def main() -> int:
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON: {e}", file=sys.stderr)
        return 1

    prompt = data.get("prompt", "")

    # Prepend the translator instructions above the user's prompt.
    additional_context = {
        "title": "Korean-English translator preface",
        "content": INSTRUCTIONS,
    }

    output = {
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": [additional_context],
            "modifiedPrompt": f"{INSTRUCTIONS}\n{prompt}",
        }
    }

    print(json.dumps(output))
    return 0


if __name__ == "__main__":
    sys.exit(main())


