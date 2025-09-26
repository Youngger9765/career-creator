#!/usr/bin/env python3

import psycopg2

# Staging database connection
DATABASE_URL = "postgresql://postgres.nnjdyxiiyhawwbkfyhtr:tJuY08NBljdc00F0@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"


def drop_all_tables():
    """Drop all tables in the staging database"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # Get all table names
        cur.execute(
            """
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename != 'spatial_ref_sys'
        """
        )

        tables = cur.fetchall()

        if not tables:
            print("No tables found to drop")
        else:
            print(f"Found {len(tables)} tables to drop")

            # Drop each table
            for table in tables:
                table_name = table[0]
                print(f"Dropping table: {table_name}")
                cur.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE")

            conn.commit()
            print("✅ All tables dropped successfully")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
            conn.close()


if __name__ == "__main__":
    print("🔄 Cleaning staging database...")
    print("⚠️  WARNING: This will DROP ALL TABLES in the staging database!")

    response = input("Are you sure? Type 'yes' to continue: ")
    if response.lower() == "yes":
        drop_all_tables()
    else:
        print("Cancelled")
