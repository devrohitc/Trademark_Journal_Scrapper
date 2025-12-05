"""
Fix enum values in database - convert lowercase to uppercase
"""
import pymysql
from src.config.settings import settings

# Parse DATABASE_URL
# Format: mysql+pymysql://root:root@localhost:3306/trademark_db
url_parts = settings.DATABASE_URL.replace('mysql+pymysql://', '').split('@')
user_pass = url_parts[0].split(':')
host_db = url_parts[1].split('/')

username = user_pass[0]
password = user_pass[1]
host_port = host_db[0].split(':')
host = host_port[0]
port = int(host_port[1]) if len(host_port) > 1 else 3306
database = host_db[1]

print(f"Connecting to {database} on {host}:{port}...")

# Connect to database
connection = pymysql.connect(
    host=host,
    port=port,
    user=username,
    password=password,
    database=database
)

try:
    with connection.cursor() as cursor:
        print("Updating enum definitions...")
        
        # Update journals table
        cursor.execute("""
            ALTER TABLE journals 
            MODIFY status ENUM('PENDING','PROCESSING','COMPLETED','ERROR') 
            DEFAULT 'PENDING'
        """)
        print("✅ Updated journals.status enum")
        
        # Update pdf_files table
        cursor.execute("""
            ALTER TABLE pdf_files 
            MODIFY extraction_status ENUM('PENDING','PROCESSING','COMPLETED','ERROR') 
            DEFAULT 'PENDING'
        """)
        print("✅ Updated pdf_files.extraction_status enum")
        
        # Update scraper_logs execution_type
        cursor.execute("""
            ALTER TABLE scraper_logs 
            MODIFY execution_type ENUM('SCHEDULED','MANUAL') 
            DEFAULT 'SCHEDULED'
        """)
        print("✅ Updated scraper_logs.execution_type enum")
        
        # Update scraper_logs status
        cursor.execute("""
            ALTER TABLE scraper_logs 
            MODIFY status ENUM('SUCCESS','FAILURE','PARTIAL') 
            NOT NULL
        """)
        print("✅ Updated scraper_logs.status enum")
        
        connection.commit()
        print("\n🎉 All enum values updated successfully!")
        
except Exception as e:
    print(f"❌ Error: {e}")
    connection.rollback()
finally:
    connection.close()
