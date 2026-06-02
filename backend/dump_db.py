import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core import serializers
from django.apps import apps

exclude_models = ['contenttypes.contenttype', 'auth.permission', 'admin.logentry']

all_objects = []
for model in apps.get_models():
    if model._meta.label_lower in exclude_models:
        continue
    # Use natural keys
    data = serializers.serialize('json', model.objects.all(), use_natural_foreign_keys=True, use_natural_primary_keys=True)
    objects = json.loads(data)
    all_objects.extend(objects)

with open('datadump.json', 'w', encoding='utf-8') as f:
    json.dump(all_objects, f, indent=4)

print("Dump successful!")
