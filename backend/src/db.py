import sqlite3
import os
import json
from datetime import datetime
import logging

logger = logging.getLogger("db")

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "shiksha.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            name TEXT PRIMARY KEY,
            level TEXT,
            topics TEXT,
            mistakes TEXT,
            last_interaction TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS escalations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            summary TEXT,
            urgency TEXT,
            follow_up TEXT,
            status TEXT,
            created_at TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def get_user_info(name: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT level, topics, mistakes, last_interaction FROM users WHERE name = ? COLLATE NOCASE", (name,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "name": name,
                "level": row[0],
                "topics": row[1],
                "mistakes": row[2],
                "last_interaction": row[3]
            }
        return None
    except Exception as e:
        logger.error(f"Error fetching user {name}: {e}")
        return None

def save_user_info(name: str, level: str, topics: str, mistakes: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO users (name, level, topics, mistakes, last_interaction)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
                level=excluded.level,
                topics=excluded.topics,
                mistakes=excluded.mistakes,
                last_interaction=excluded.last_interaction
        """, (name, level, topics, mistakes, now))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Error saving user {name}: {e}")
        return False

def create_escalation_ticket(name: str, summary: str, urgency: str, follow_up: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO escalations (name, summary, urgency, follow_up, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (name, summary, urgency, follow_up, "open", now))
        conn.commit()
        ticket_id = cursor.lastrowid
        conn.close()
        return ticket_id
    except Exception as e:
        logger.error(f"Error creating escalation ticket for {name}: {e}")
        return None
