import sqlite3
import os

SOURCE_DB_PATH = "../ProcessedData.db"
TARGET_DB_PATH = "../CourseInfo.db"

def get_csci_courses():
    # Connect to source database
    conn = sqlite3.connect(SOURCE_DB_PATH)
    cursor = conn.cursor()

    query = """
    SELECT dept_abbr, course_num, class_desc, cred_min, onestop_desc
    FROM classdistribution
    WHERE dept_abbr = 'CSCI'
    ORDER BY course_num;
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()

    # Create target database and insert data
    if os.path.exists(TARGET_DB_PATH):
        os.remove(TARGET_DB_PATH)

    target_conn = sqlite3.connect(TARGET_DB_PATH)
    target_cursor = target_conn.cursor()

    target_cursor.execute("""
    CREATE TABLE csci_courses (
        dept TEXT,
        number TEXT,
        title TEXT,
        credits INTEGER,
        description TEXT
    );
    """)

    target_cursor.executemany("""
    INSERT INTO csci_courses (dept, number, title, credits, description)
    VALUES (?, ?, ?, ?, ?);
    """, rows)

    target_conn.commit()
    target_conn.close()
    print(f"Inserted {len(rows)} courses into CourseInfo.db")

if __name__ == "__main__":
    get_csci_courses()