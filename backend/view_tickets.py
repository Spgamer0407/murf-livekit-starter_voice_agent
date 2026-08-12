import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "shiksha.db")

def print_escalations_vertically(cursor):
    try:
        cursor.execute("SELECT * FROM escalations")
        rows = cursor.fetchall()
        
        if not rows:
            print("No escalation tickets found.")
            return
            
        col_names = [description[0] for description in cursor.description]
        
        print("\n=== ESCALATION TICKETS (Calls to Human Agent) ===")
        for i, row in enumerate(rows):
            print(f"\n--- Ticket #{row[0]} ---")
            for col_name, val in zip(col_names[1:], row[1:]): # skip the 'id' since it's in the header
                # Clean up any newlines that might mess up formatting
                val_str = str(val).replace('\n', ' ').replace('\r', '')
                print(f"{col_name.capitalize():<12}: {val_str}")
            
    except Exception as e:
        print(f"Error reading escalations: {e}")

def main():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print_escalations_vertically(cursor)

    conn.close()

if __name__ == "__main__":
    main()
