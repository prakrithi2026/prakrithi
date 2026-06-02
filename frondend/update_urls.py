import os
import re

src_dir = 'src'
for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.jsx', '.js')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = re.sub(r'\'http://127\.0\.0\.1:8000(/api[^\']*)\'', r'`${import.meta.env.VITE_API_URL || \'http://127.0.0.1:8000/api\'}\1`', content)
            new_content = re.sub(r'\"http://127\.0\.0\.1:8000(/api[^\"]*)\"', r'`${import.meta.env.VITE_API_URL || \'http://127.0.0.1:8000/api\'}\1`', new_content)
            new_content = re.sub(r'\`http://127\.0\.0\.1:8000(/api[^\`]*)\`', r'`${import.meta.env.VITE_API_URL || \'http://127.0.0.1:8000/api\'}\1`', new_content)

            # fix the duplicate /api /api
            new_content = new_content.replace("/api/api", "/api")

            if content != new_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {filepath}')
