import sqlite3
import re

DB_PATH = "../ProcessedData.db"

def extract_and_add_courseGroupId():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(classDistribution);")
    print(cursor.fetchall())

    # 1. Add the new column (if it doesn't exist already)
    cursor.execute("ALTER TABLE classDistribution ADD COLUMN courseGroupId TEXT;")

    # 2. Select all rows with onestop
    cursor.execute("SELECT rowid, onestop FROM classDistribution;")
    rows = cursor.fetchall()

    # 3. Extract ID from URL and update courseGroupId
    for rowid, url in rows:
        if url and isinstance(url, str):
            match = re.search(r'/courses/(\d+)', url)
            if match:
                course_id = match.group(1)
                cursor.execute(
                    "UPDATE classDistribution SET courseGroupId = ? WHERE rowid = ?",
                    (course_id, rowid)
                )

    conn.commit()
    conn.close()
    print("courseGroupId column updated successfully.")

if __name__ == "__main__":
    extract_and_add_courseGroupId()