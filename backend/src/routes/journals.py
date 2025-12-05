"""
Journal API routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from pathlib import Path
import shutil

from ..config.database import get_db
from ..models.models import Journal, PDFFile, TrademarkApplication
from ..config.settings import settings
from .schemas import JournalResponse, JournalListResponse


router = APIRouter()


@router.get("", response_model=JournalListResponse)
async def list_journals(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all journals with pagination
    """
    query = db.query(Journal)
    
    if status:
        query = query.filter(Journal.status == status)
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    journals = query.order_by(Journal.publication_date.desc())\
        .offset((page - 1) * limit)\
        .limit(limit)\
        .all()
    
    return {
        "journals": journals,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/latest", response_model=List[JournalResponse])
async def get_latest_journals(
    count: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Get latest N journals
    """
    journals = db.query(Journal)\
        .order_by(Journal.publication_date.desc())\
        .limit(count)\
        .all()
    
    return journals


@router.get("/{journal_id}", response_model=JournalResponse)
async def get_journal(
    journal_id: int,
    db: Session = Depends(get_db)
):
    """
    Get specific journal by ID
    """
    journal = db.query(Journal).filter(Journal.id == journal_id).first()
    
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    
    return journal


@router.get("/{journal_id}/trademarks")
async def get_journal_trademarks(
    journal_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Get all trademarks from a specific journal
    """
    from ..models.models import TrademarkApplication
    
    # Check if journal exists
    journal = db.query(Journal).filter(Journal.id == journal_id).first()
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    
    # Get trademarks
    query = db.query(TrademarkApplication).filter(
        TrademarkApplication.journal_id == journal_id
    )
    
    total = query.count()
    
    trademarks = query.offset((page - 1) * limit)\
        .limit(limit)\
        .all()
    
    return {
        "journal": journal,
        "trademarks": trademarks,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.delete("/{journal_id}")
async def delete_journal(
    journal_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a specific journal and all associated data:
    - PDF files from disk
    - PDF records from database
    - Trademark records from database
    - Journal record from database
    """
    # Check if journal exists
    journal = db.query(Journal).filter(Journal.id == journal_id).first()
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    
    try:
        # Get all PDF files for this journal
        pdf_files = db.query(PDFFile).filter(PDFFile.journal_id == journal_id).all()
        
        # Delete PDF files from disk
        deleted_files = 0
        for pdf in pdf_files:
            file_path = Path(pdf.file_path)
            if file_path.exists():
                file_path.unlink()
                deleted_files += 1
        
        # Delete journal directory if empty
        journal_dir = Path(settings.DOWNLOAD_DIR) / journal.journal_number
        if journal_dir.exists() and not list(journal_dir.iterdir()):
            journal_dir.rmdir()
        
        # Delete all trademarks for this journal
        deleted_trademarks = db.query(TrademarkApplication)\
            .filter(TrademarkApplication.journal_id == journal_id)\
            .delete()
        
        # Delete all PDF records
        deleted_pdfs = db.query(PDFFile)\
            .filter(PDFFile.journal_id == journal_id)\
            .delete()
        
        # Delete journal
        db.delete(journal)
        db.commit()
        
        return {
            "message": f"Journal {journal.journal_number} deleted successfully",
            "deleted": {
                "journal_number": journal.journal_number,
                "trademarks": deleted_trademarks,
                "pdfs": deleted_pdfs,
                "files": deleted_files
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting journal: {str(e)}")

