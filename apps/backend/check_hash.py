import hashlib
import os

def check_database_hash():
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    if not os.path.exists(db_path):
        print("Database file not found")
        return
    
    with open(db_path, 'rb') as f:
        content = f.read()
    
    sha256_hash = hashlib.sha256(content).hexdigest().upper()
    
    print(f"Database SHA-256:")
    print(sha256_hash)
    
    # 與預期值比較
    expected = "EB7BEA2222849276D1B323598BD5C27B51A4ED4AFA1DCF19A468832A44CDF0C3"
    
    if sha256_hash == expected:
        print(f"\nDatabase SHA-256 unchanged: YES")
        print(f"Matches expected: {expected}")
    else:
        print(f"\nDatabase SHA-256 unchanged: NO")
        print(f"Expected: {expected}")
        print(f"Actual:   {sha256_hash}")
        print("\nWARNING: Database has been modified!")

if __name__ == "__main__":
    check_database_hash()