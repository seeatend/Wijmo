import json
import bson
import os
import csv
import json

tables = ['contacts', 'events', 'venues', 'tracks', 'songs']
top_object = {}

for table in tables:
  titles = []
  csv_file = 'csv/' + table + '.csv'
  reader = csv.DictReader(open(csv_file))

  for row in reader:
      id = row['id']
      del row['id']
      top_object[table] = dict(top_object[table] if table in top_object else {}, **{ id: row})

print json.dumps(top_object, sort_keys=False, indent=4, separators=(',', ': '))

