"""
PDF extraction service for trademark data
"""
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import pdfplumber
from sqlalchemy.orm import Session

from ..models.models import PDFFile, TrademarkApplication, ExtractionStatus
from ..config.settings import settings


class PDFExtractor:
    """
    Extracts trademark application data from PDF files
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def extract_pdf(self, pdf_file: PDFFile) -> int:
        """
        Extract trademark applications from a PDF file
        
        Args:
            pdf_file: PDFFile object to extract
        
        Returns:
            Number of records extracted
        """
        try:
            pdf_file.extraction_status = ExtractionStatus.PROCESSING
            self.db.commit()
            
            print(f"📖 Extracting data from {pdf_file.file_name}...")
            
            # Open and process PDF
            records = self._process_pdf(pdf_file)
            
            # Save records to database
            records_saved = 0
            for record in records:
                try:
                    trademark = TrademarkApplication(
                        pdf_file_id=pdf_file.id,
                        journal_id=pdf_file.journal_id,
                        **record
                    )
                    self.db.add(trademark)
                    records_saved += 1
                except Exception as e:
                    print(f"  ⚠️  Error saving record: {str(e)}")
                    continue
            
            self.db.commit()
            
            # Update PDF file status
            pdf_file.extraction_status = ExtractionStatus.COMPLETED
            pdf_file.extraction_date = datetime.utcnow()
            pdf_file.records_extracted = records_saved
            self.db.commit()
            
            print(f"✅ Extracted {records_saved} records from {pdf_file.file_name}")
            return records_saved
            
        except Exception as e:
            pdf_file.extraction_status = ExtractionStatus.ERROR
            pdf_file.error_message = str(e)
            self.db.commit()
            print(f"❌ Error extracting {pdf_file.file_name}: {str(e)}")
            return 0
    
    def _process_pdf(self, pdf_file: PDFFile) -> List[Dict]:
        """
        Process PDF and extract trademark records
        """
        records = []
        
        with pdfplumber.open(pdf_file.file_path) as pdf:
            current_record = {}
            current_text = []
            page_num = 0
            
            for page in pdf.pages:
                page_num += 1
                text = page.extract_text()
                
                if not text:
                    continue
                
                # Split into lines
                lines = text.split('\n')
                
                # Process each line
                for line in lines:
                    line = line.strip()
                    
                    if not line:
                        continue
                    
                    # Check for new trademark entry (application number pattern)
                    app_num_match = re.match(r'^(\d{7,10})\s+(\d{2}/\d{2}/\d{4})', line)
                    
                    if app_num_match:
                        # Save previous record if exists
                        if current_record and current_text:
                            current_record['raw_text'] = '\n'.join(current_text)
                            records.append(current_record.copy())
                        
                        # Start new record
                        current_record = {
                            'application_number': app_num_match.group(1),
                            'filing_date': self._parse_date(app_num_match.group(2)),
                            'page_number': page_num
                        }
                        current_text = [line]
                    else:
                        # Accumulate text for current record
                        current_text.append(line)
                        
                        # Extract specific fields
                        self._extract_fields(line, current_record, current_text)
            
            # Save last record
            if current_record and current_text:
                current_record['raw_text'] = '\n'.join(current_text)
                records.append(current_record)
        
        # Post-process records
        for record in records:
            self._post_process_record(record)
        
        return records
    
    def _extract_fields(self, line: str, record: Dict, text_lines: List[str]):
        """
        Extract specific fields from text lines
        """
        # Applicant name (usually after application number)
        if 'applicant_name' not in record and len(text_lines) >= 3:
            # Usually line 2 is the applicant name
            if len(text_lines) == 3:
                record['applicant_name'] = text_lines[2]
        
        # Class number
        class_match = re.search(r'Class\s+(\d+)', line, re.IGNORECASE)
        if class_match:
            record['class_number'] = int(class_match.group(1))
        
        # Office location
        office_match = re.search(r'(MUMBAI|DELHI|KOLKATA|CHENNAI|AHMEDABAD)', line, re.IGNORECASE)
        if office_match:
            record['office_location'] = office_match.group(1).upper()
        
        # Applicant type
        type_keywords = ['INDIVIDUAL', 'PARTNERSHIP', 'PRIVATE LIMITED', 'LIMITED COMPANY', 
                        'LLP', 'PROPRIETORSHIP', 'BODY INCORPORATE', 'HUF']
        for keyword in type_keywords:
            if keyword in line.upper():
                record['applicant_type'] = keyword
                break
        
        # Used since
        used_match = re.search(r'Used Since\s*:?\s*(\d{2}/\d{2}/\d{4})', line, re.IGNORECASE)
        if used_match:
            record['used_since'] = used_match.group(1)
        
        # Associated with
        assoc_match = re.search(r'To be associated with\s*:?\s*(\d+)', line, re.IGNORECASE)
        if assoc_match:
            record['associated_with'] = assoc_match.group(1)
        
        # Attorney/Agent address
        if 'Address for service' in line or 'Attorney address' in line or 'Agents address' in line:
            record['_in_attorney_section'] = True
        
        if record.get('_in_attorney_section') and 'attorney_address' not in record:
            if not any(keyword in line for keyword in ['Address for service', 'Attorney', 'Proposed', 'Used Since']):
                if 'attorney_address' not in record:
                    record['attorney_address'] = line
                else:
                    record['attorney_address'] += ' ' + line
    
    def _post_process_record(self, record: Dict):
        """
        Post-process extracted record
        """
        # Extract goods and services (everything after address until next section)
        raw_text = record.get('raw_text', '')
        lines = raw_text.split('\n')
        
        # Find applicant address (multi-line)
        applicant_lines = []
        goods_lines = []
        in_goods = False
        
        for i, line in enumerate(lines):
            # Skip first few lines (app number, date, name)
            if i < 3:
                continue
            
            # Check for section markers
            if any(marker in line for marker in ['Address for service', 'Proposed to be Used', 'MUMBAI', 'DELHI', 'CHENNAI', 'KOLKATA', 'AHMEDABAD']):
                in_goods = True
                if any(city in line for city in ['MUMBAI', 'DELHI', 'CHENNAI', 'KOLKATA', 'AHMEDABAD']):
                    record['office_location'] = line.strip()
                continue
            
            # Collect applicant address lines
            if not in_goods and line.strip() and len(applicant_lines) < 5:
                # Skip if it's a class line or other metadata
                if not re.match(r'^(Class|Individual|Partnership|Private|Limited|LLP|Used Since)', line, re.IGNORECASE):
                    applicant_lines.append(line.strip())
            
            # Collect goods/services lines
            if in_goods and line.strip():
                # Stop at certain markers
                if any(marker in line for marker in ['Associated with', 'Mark can be', 'Registration of', 'THIS IS CONDITION']):
                    break
                goods_lines.append(line.strip())
        
        # Set applicant address (first 1-2 lines after name)
        if applicant_lines and 'applicant_address' not in record:
            record['applicant_address'] = ', '.join(applicant_lines[:3])
        
        # Set goods and services
        if goods_lines:
            record['goods_services'] = ' '.join(goods_lines[:10])  # Limit length
        
        # Extract trademark name from raw text if not found
        if 'trademark_name' not in record:
            # Look for a prominent text/name (usually in first 10 lines)
            for line in lines[2:8]:
                if line.strip() and len(line) > 3 and not re.match(r'^\d', line):
                    # Check if it's not an address or other metadata
                    if not any(word in line.lower() for word in ['address', 'service', 'mumbai', 'delhi', 'road', 'floor']):
                        record['trademark_name'] = line.strip()
                        break
        
        # Clean up temporary fields
        if '_in_attorney_section' in record:
            del record['_in_attorney_section']
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """
        Parse date string in DD/MM/YYYY format
        """
        try:
            return datetime.strptime(date_str, "%d/%m/%Y").date()
        except:
            return None
    
    def extract_all_pending(self) -> Dict[str, int]:
        """
        Extract all PDFs with pending status
        
        Returns:
            Dictionary with extraction statistics
        """
        pending_pdfs = self.db.query(PDFFile).filter(
            PDFFile.extraction_status == ExtractionStatus.PENDING
        ).all()
        
        stats = {
            'total_pdfs': len(pending_pdfs),
            'processed': 0,
            'records': 0,
            'errors': 0
        }
        
        for pdf_file in pending_pdfs:
            records = self.extract_pdf(pdf_file)
            if records > 0:
                stats['processed'] += 1
                stats['records'] += records
            else:
                stats['errors'] += 1
        
        return {
            'pdfs_total': stats['total_pdfs'],
            'pdfs_processed': stats['processed'],
            'records': stats['records'],
            'errors': stats['errors']
        }
        return stats
