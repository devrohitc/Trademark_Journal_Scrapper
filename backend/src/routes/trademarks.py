"""
Trademark API routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional

from ..config.database import get_db
from ..models.models import TrademarkApplication
from .schemas import TrademarkResponse, TrademarkListResponse


router = APIRouter()


@router.get("", response_model=TrademarkListResponse)
async def list_trademarks(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    class_number: Optional[int] = Query(None, ge=1, le=45),
    journal_id: Optional[int] = None,
    applicant: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List trademarks with search and filters
    """
    query = db.query(TrademarkApplication)
    
    # Apply filters
    if search:
        search_filter = or_(
            TrademarkApplication.trademark_name.like(f"%{search}%"),
            TrademarkApplication.applicant_name.like(f"%{search}%"),
            TrademarkApplication.application_number.like(f"%{search}%"),
            TrademarkApplication.goods_services.like(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if class_number:
        query = query.filter(TrademarkApplication.class_number == class_number)
    
    if journal_id:
        query = query.filter(TrademarkApplication.journal_id == journal_id)
    
    if applicant:
        query = query.filter(TrademarkApplication.applicant_name.like(f"%{applicant}%"))
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    trademarks = query.order_by(TrademarkApplication.created_at.desc())\
        .offset((page - 1) * limit)\
        .limit(limit)\
        .all()
    
    return {
        "trademarks": trademarks,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/search")
async def search_trademarks(
    q: str = Query(..., min_length=3),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Full-text search for trademarks
    """
    # Use LIKE for basic search (can be upgraded to FULLTEXT later)
    query = db.query(TrademarkApplication).filter(
        or_(
            TrademarkApplication.trademark_name.like(f"%{q}%"),
            TrademarkApplication.applicant_name.like(f"%{q}%"),
            TrademarkApplication.goods_services.like(f"%{q}%")
        )
    )
    
    total = query.count()
    
    trademarks = query.order_by(TrademarkApplication.created_at.desc())\
        .offset((page - 1) * limit)\
        .limit(limit)\
        .all()
    
    return {
        "query": q,
        "trademarks": trademarks,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/{trademark_id}", response_model=TrademarkResponse)
async def get_trademark(
    trademark_id: int,
    db: Session = Depends(get_db)
):
    """
    Get specific trademark by ID
    """
    trademark = db.query(TrademarkApplication)\
        .filter(TrademarkApplication.id == trademark_id)\
        .first()
    
    if not trademark:
        raise HTTPException(status_code=404, detail="Trademark not found")
    
    return trademark
