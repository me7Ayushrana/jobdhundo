import os
import re

SRC_DIR = "src"

# Regex to match Tailwind dark: classes (handles nested modifiers like dark:hover:bg-stone-800)
DARK_CLASS_REGEX = re.compile(r'\s*dark:[a-zA-Z0-9\-\/:#%@\[\]\(\)\+]+')

def strip_dark_classes(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find className attributes and substitute dark: classes within them
    def replacer(match):
        class_list = match.group(0)
        cleaned = DARK_CLASS_REGEX.sub("", class_list)
        # Clean up any duplicate spacing
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned

    # Match className="..." or className={`...`} or similar structures
    pattern = re.compile(r'className=["\'`][^"\'`]*["\'`]')
    new_content = pattern.sub(replacer, content)

    if new_content != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Cleaned dark classes in: {file_path}")

def run():
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith((".tsx", ".ts")):
                strip_dark_classes(os.path.join(root, file))

if __name__ == "__main__":
    run()
