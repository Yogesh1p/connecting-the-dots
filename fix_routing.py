import re

# 1. Update lib-data.js
lib_file = '/Users/yogesh/Documents/connecting-the-dots/builder/lib-data.js'
with open(lib_file, 'r') as f:
    lib_data = f.read()

lib_data = lib_data.replace('"url": "../depreciated/experiments/chapter_1/"', '"url": "../Library/ai/01.generative-models/01.autoregressive-models/07.experiments/"')
lib_data = lib_data.replace('"cleanUrl": "../depreciated/experiments/chapter_1/"', '"cleanUrl": "../Library/ai/generative-models/autoregressive-models/experiments/"')
lib_data = lib_data.replace('"sourcePath": "depreciated/experiments/chapter_1/index.html"', '"sourcePath": "Library/ai/01.generative-models/01.autoregressive-models/07.experiments/index.html"')
lib_data = lib_data.replace('"publicPath": "depreciated/experiments/chapter_1/"', '"publicPath": "Library/ai/01.generative-models/01.autoregressive-models/07.experiments/"')
lib_data = lib_data.replace('"cleanPath": "depreciated/experiments/chapter_1/"', '"cleanPath": "Library/ai/generative-models/autoregressive-models/experiments/"')

lib_data = lib_data.replace('"lessonorder": 1,\n    "lessonNumber": "1",\n    "part": "Main",', '"lessonorder": 7,\n    "lessonNumber": "7",\n    "part": "Main",')

with open(lib_file, 'w') as f:
    f.write(lib_data)


# 2. Update references in articles
file1 = '/Users/yogesh/Documents/connecting-the-dots/Library/ai/01.generative-models/01.autoregressive-models/05.attention-mechanism/index.html'
file2 = '/Users/yogesh/Documents/connecting-the-dots/Library/ai/01.generative-models/01.autoregressive-models/06.the-transformer-architecture/index.html'

old_link = 'href="/article/exp00001"'
# Actually, wait, the href was `/article/exp00001`. The href wasn't `../../../..` anymore! I changed it to `/article/exp00001`!
# Let me double check.

