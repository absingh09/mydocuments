import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = "mydocumentsdb"

client: AsyncIOMotorClient = None


async def connect_db():
    global client
    client = AsyncIOMotorClient(MONGODB_URI)
    print("[OK] Connected to MongoDB Atlas")


async def close_db():
    global client
    if client:
        client.close()
        print("[--] MongoDB connection closed")


def get_db():
    return client[DB_NAME]


def get_users_collection():
    return client[DB_NAME]["users"]


def get_documents_collection():
    return client[DB_NAME]["documents"]
