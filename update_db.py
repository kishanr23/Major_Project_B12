import sqlite3

conn = sqlite3.connect(r'c:\TrailGuard\services\dashboard\trailguard.db')
conn.execute("UPDATE trail_catalog SET country='India', state='Karnataka', district='Chikkaballapur' WHERE name='Nandi Hills Trail'")
conn.commit()
conn.close()
print("Database updated!")
