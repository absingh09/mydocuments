from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from database import get_documents_collection
from models import DocumentCreate, DocumentOut, DocumentUpdate

router = APIRouter(prefix="/api/documents", tags=["documents"])


def _doc_to_out(doc: dict, include_data: bool = False) -> dict:
    out = {
        "id": str(doc["_id"]),
        "name": doc.get("name", "Untitled"),
        "issuer": doc.get("issuer", ""),
        "date": doc.get("date", ""),
        "file_type": doc.get("file_type", ""),
        "filename": doc.get("filename", ""),
        "uploaded_at": doc.get("uploaded_at", ""),
    }
    if include_data:
        out["data"] = doc.get("data", "")
    return out


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(payload: DocumentCreate, current_user: dict = Depends(get_current_user)):
    docs = get_documents_collection()
    doc = {
        "user_id": current_user["user_id"],
        "name": payload.name,
        "issuer": payload.issuer or "",
        "date": payload.date or "",
        "file_type": payload.file_type,
        "filename": payload.filename,
        "data": payload.data,
        "uploaded_at": datetime.now(timezone.utc).strftime("%B %Y"),
    }
    result = await docs.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc, include_data=False)


@router.get("", response_model=List[DocumentOut])
async def list_documents(current_user: dict = Depends(get_current_user)):
    docs = get_documents_collection()
    cursor = docs.find({"user_id": current_user["user_id"]}, {"data": 0}).sort("_id", -1)
    results = []
    async for doc in cursor:
        results.append(_doc_to_out(doc, include_data=False))
    return results


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    docs = get_documents_collection()
    try:
        oid = ObjectId(doc_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")

    doc = await docs.find_one({"_id": oid, "user_id": current_user["user_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return _doc_to_out(doc, include_data=True)


@router.put("/{doc_id}", response_model=DocumentOut)
async def update_document(
    doc_id: str, payload: DocumentUpdate, current_user: dict = Depends(get_current_user)
):
    docs = get_documents_collection()
    try:
        oid = ObjectId(doc_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")

    update_fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await docs.update_one(
        {"_id": oid, "user_id": current_user["user_id"]},
        {"$set": update_fields},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = await docs.find_one({"_id": oid}, {"data": 0})
    return _doc_to_out(doc, include_data=False)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    docs = get_documents_collection()
    try:
        oid = ObjectId(doc_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")

    result = await docs.delete_one({"_id": oid, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
