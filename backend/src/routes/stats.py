"""
Statistics API routes
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..config.database import get_db
from ..models.models import Journal, PDFFile, TrademarkApplication


router = APIRouter()


@router.get("")
async def get_statistics(db: Session = Depends(get_db)):
    """
    Get dashboard statistics
    """
    # Basic counts
    total_journals = db.query(Journal).count()
    total_pdfs = db.query(PDFFile).count()
    total_trademarks = db.query(TrademarkApplication).count()
    
    # Latest journal
    latest_journal = db.query(Journal)\
        .order_by(Journal.publication_date.desc())\
        .first()
    
    # Class distribution
    class_distribution = db.query(
        TrademarkApplication.class_number,
        func.count(TrademarkApplication.id).label('count')
    )\
        .filter(TrademarkApplication.class_number.isnot(None))\
        .group_by(TrademarkApplication.class_number)\
        .order_by(TrademarkApplication.class_number)\
        .all()
    
    # Recent journals
    recent_journals = db.query(Journal)\
        .order_by(Journal.publication_date.desc())\
        .limit(5)\
        .all()
    
    # Top applicants
    top_applicants = db.query(
        TrademarkApplication.applicant_name,
        func.count(TrademarkApplication.id).label('count')
    )\
        .filter(TrademarkApplication.applicant_name.isnot(None))\
        .group_by(TrademarkApplication.applicant_name)\
        .order_by(func.count(TrademarkApplication.id).desc())\
        .limit(10)\
        .all()
    
    # Office distribution
    office_distribution = db.query(
        TrademarkApplication.office_location,
        func.count(TrademarkApplication.id).label('count')
    )\
        .filter(TrademarkApplication.office_location.isnot(None))\
        .group_by(TrademarkApplication.office_location)\
        .all()
    
    return {
        "summary": {
            "total_journals": total_journals,
            "total_pdfs": total_pdfs,
            "total_trademarks": total_trademarks
        },
        "latest_journal": {
            "journal_number": latest_journal.journal_number if latest_journal else None,
            "publication_date": latest_journal.publication_date if latest_journal else None,
            "trademark_count": latest_journal.total_trademarks if latest_journal else 0
        } if latest_journal else None,
        "class_distribution": [
            {"class": item[0], "count": item[1]}
            for item in class_distribution
        ],
        "office_distribution": [
            {"office": item[0], "count": item[1]}
            for item in office_distribution
        ],
        "recent_journals": [
            {
                "id": j.id,
                "journal_number": j.journal_number,
                "publication_date": j.publication_date,
                "trademark_count": j.total_trademarks
            }
            for j in recent_journals
        ],
        "top_applicants": [
            {"name": item[0], "count": item[1]}
            for item in top_applicants
        ]
    }
