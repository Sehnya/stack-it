#!/usr/bin/env python3
"""
Test script to verify database connection with IPv4 preference.
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
import socket

# Load environment variables
load_dotenv()

def test_direct_connection():
    """Test direct connection to the database using psycopg2."""
    print("Testing direct connection with psycopg2...")
    
    # Get connection parameters from environment
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        user = os.getenv("user") or os.getenv("DB_USER")
        password = os.getenv("password") or os.getenv("DB_PASSWORD")
        host = os.getenv("host") or os.getenv("DB_HOST")
        port = os.getenv("port") or os.getenv("DB_PORT", "5432")
        dbname = os.getenv("dbname") or os.getenv("DB_NAME")
        
        if not all([user, password, host, port, dbname]):
            print("❌ Missing database connection parameters")
            return False
            
        db_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
    
    print(f"Using connection URL: {db_url.replace(os.getenv('password') or os.getenv('DB_PASSWORD'), '********')}")
    
    try:
        # Try to resolve the hostname to an IPv4 address
        host = db_url.split('@')[1].split(':')[0]
        print(f"Resolving hostname: {host}")
        
        try:
            # Get IPv4 addresses only
            addrinfo = socket.getaddrinfo(host, None, socket.AF_INET)
            if addrinfo:
                ipv4_addr = addrinfo[0][4][0]
                print(f"✅ Resolved to IPv4 address: {ipv4_addr}")
                
                # Use the IPv4 address directly
                conn_str = db_url.replace(host, ipv4_addr)
                print(f"Using IPv4 connection string: {conn_str.replace(os.getenv('password') or os.getenv('DB_PASSWORD'), '********')}")
                
                # Connect using the IPv4 address
                conn = psycopg2.connect(conn_str)
                cursor = conn.cursor()
                cursor.execute("SELECT NOW();")
                result = cursor.fetchone()
                print(f"✅ Connection successful! Current time: {result[0]}")
                cursor.close()
                conn.close()
                return True
            else:
                print("❌ No IPv4 addresses found for the host")
        except socket.gaierror as e:
            print(f"❌ Failed to resolve hostname: {e}")
            
        # Fall back to original connection with IPv4 options
        print("Falling back to original connection with IPv4 options...")
        conn = psycopg2.connect(
            db_url,
            options="-c prefer_ipv4=true"
        )
        cursor = conn.cursor()
        cursor.execute("SELECT NOW();")
        result = cursor.fetchone()
        print(f"✅ Connection successful! Current time: {result[0]}")
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    success = test_direct_connection()
    sys.exit(0 if success else 1)