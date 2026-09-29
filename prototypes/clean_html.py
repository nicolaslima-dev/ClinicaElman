import os
import re

dir_path = r"c:\Projetos\ClinicaElman\prototypes"

for filename in os.listdir(dir_path):
    if filename.endswith(".html"):
        file_path = os.path.join(dir_path, filename)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Remove Supabase comment
        content = re.sub(r'^\s*<!-- Supabase -->\s*\n', '', content, flags=re.MULTILINE)
        # Remove Supabase script
        content = re.sub(r'^\s*<script src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@2"></script>\s*\n', '', content, flags=re.MULTILINE)
        # Remove env.js script
        content = re.sub(r'^\s*<script src="env\.js"></script>\s*\n', '', content, flags=re.MULTILINE)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

print("HTML files cleaned.")
