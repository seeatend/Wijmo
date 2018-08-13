import pymysql
from bson import ObjectId
# Open database connection
connection = pymysql.connect("localhost","root","shubhamd11","test" )
tables = ['venues', 'contacts', 'events', 'songs', 'tracks']
prefixes = ['venue', 'contact', 'event', 'song', 'track']
# prepare a cursor object using cursor() method
cursor = connection.cursor()

try:
    rs = []
    for key, table in enumerate(tables):
      with connection.cursor() as cursor:
        sql = "SELECT * FROM %s" % (table)
        cursor.execute(sql)
        rs = cursor.fetchall()

      prefix = prefixes[key]
      with connection.cursor() as cursor:
        for row in rs:
          id = row[0]
          sql = "UPDATE %s set id = '%s' where id = '%s'" % (table, prefix + '-' + str(ObjectId()), id);
          cursor.execute(sql)
      connection.commit()
finally:
    connection.close()
