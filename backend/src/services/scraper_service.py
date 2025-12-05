"""
Web scraper service for Trademark Journal website
"""
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
from playwright.sync_api import sync_playwright, Page
from sqlalchemy.orm import Session

from ..models.models import Journal, PDFFile, JournalStatus, ExtractionStatus
from ..config.settings import settings


class TrademarkScraper:
    """
    Scrapes trademark journal PDFs from IP India website
    """
    
    BASE_URL = "https://search.ipindia.gov.in/IPOJournal/Journal/Trademark"
    
    def __init__(self, db: Session):
        self.db = db
        self.download_dir = Path(settings.DOWNLOAD_DIR)
        self.download_dir.mkdir(exist_ok=True)
    
    def scrape_latest_journals(self, max_journals: int = 2) -> List[Journal]:
        """
        Scrape latest journal entries from the website
        
        Args:
            max_journals: Maximum number of journals to scrape (default: 2)
        
        Returns:
            List of Journal objects
        """
        journals = []
        
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()
            
            try:
                print(f"📡 Navigating to {self.BASE_URL}...")
                page.goto(self.BASE_URL, timeout=60000)
                page.wait_for_selector("table", timeout=30000)
                
                # Extract table data
                journal_data = self._extract_table_data(page, max_journals)
                print(f"✅ Found {len(journal_data)} journal entries")
                
                # Process each journal
                for data in journal_data:
                    # Check if already exists
                    existing = self.db.query(Journal).filter(
                        Journal.journal_number == data["journal_number"]
                    ).first()
                    
                    if existing:
                        print(f"📋 Journal {data['journal_number']} already exists")
                        # Check if it has PDFs already
                        if existing.pdf_count > 0:
                            print(f"   ✅ Already has {existing.pdf_count} PDFs, skipping download...")
                            journals.append(existing)
                            continue
                        else:
                            print(f"   🔄 No PDFs yet, attempting download...")
                            journal = existing
                    else:
                        # Create new journal entry
                        journal = Journal(
                            journal_number=data["journal_number"],
                            publication_date=data["publication_date"],
                            availability_date=data["availability_date"],
                            status=JournalStatus.PENDING
                        )
                        self.db.add(journal)
                        self.db.commit()
                        self.db.refresh(journal)
                        
                        print(f"📝 Created journal entry: {journal.journal_number}")
                    
                    # Download PDFs for this journal
                    self._download_journal_pdfs(page, journal, data["row_index"])
                    
                    journals.append(journal)
                
            except Exception as e:
                print(f"❌ Error during scraping: {str(e)}")
                raise
            finally:
                browser.close()
        
        return journals
    
    def _extract_table_data(self, page: Page, max_journals: int) -> List[Dict]:
        """
        Extract journal data from table
        """
        journal_data = []
        
        # Get table rows (skip header)
        rows = page.query_selector_all("table tbody tr")
        
        for idx, row in enumerate(rows[:max_journals]):
            try:
                cells = row.query_selector_all("td")
                
                if len(cells) >= 4:
                    # Extract text from cells
                    sr_no = cells[0].inner_text()
                    journal_no = cells[1].inner_text()
                    pub_date = cells[2].inner_text()
                    avail_date = cells[3].inner_text()
                    
                    # Parse dates (format: DD/MM/YYYY)
                    pub_date_obj = datetime.strptime(pub_date.strip(), "%d/%m/%Y").date()
                    avail_date_obj = datetime.strptime(avail_date.strip(), "%d/%m/%Y").date()
                    
                    journal_data.append({
                        "sr_no": sr_no.strip(),
                        "journal_number": journal_no.strip(),
                        "publication_date": pub_date_obj,
                        "availability_date": avail_date_obj,
                        "row_index": idx
                    })
                    
                    print(f"📋 Extracted: Journal {journal_no.strip()} - {pub_date.strip()}")
                    
            except Exception as e:
                print(f"⚠️  Error extracting row {idx}: {str(e)}")
                continue
        
        return journal_data
    
    def _download_journal_pdfs(self, page: Page, journal: Journal, row_index: int):
        """
        Download all PDFs for a specific journal
        """
        try:
            journal.status = JournalStatus.PROCESSING
            self.db.commit()
            
            # Create directory for this journal
            journal_dir = self.download_dir / journal.journal_number
            journal_dir.mkdir(exist_ok=True)
            
            # Find the download cell in the row
            rows = page.query_selector_all("table tbody tr")
            row = rows[row_index]
            download_cell = row.query_selector("td:last-child")
            
            # Debug: Print cell HTML
            cell_html = download_cell.inner_html()
            print(f"🔍 Debug - Download cell HTML: {cell_html[:500]}")
            
            # Find all forms (new approach - website uses form submissions)
            forms = download_cell.query_selector_all("form")
            
            print(f"📥 Found {len(forms)} PDF forms for journal {journal.journal_number}")
            
            pdf_count = 0
            for form_idx, form in enumerate(forms):
                try:
                    # Get the hidden input with filename
                    filename_input = form.query_selector("input[name='FileName']")
                    button = form.query_selector("button")
                    
                    if filename_input and button:
                        filename = filename_input.get_attribute("value")
                        button_text = button.inner_text().strip()
                        
                        print(f"  📄 Form {form_idx + 1}: File={filename}, Button={button_text}")
                        
                        # Extract class range from button text or filename
                        class_range = self._extract_class_range(button_text, form_idx)
                        
                        # Download the PDF by submitting the form
                        pdf_file = self._download_pdf_from_form(
                            page, form, filename, journal, journal_dir, class_range
                        )
                        
                        if pdf_file:
                            pdf_count += 1
                    else:
                        print(f"  ⏭️  Form {form_idx + 1} skipped - missing filename input or button")
                        
                except Exception as e:
                    print(f"⚠️  Error processing form {form_idx + 1}: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    continue
            
            # Update journal
            journal.pdf_count = pdf_count
            journal.status = JournalStatus.COMPLETED if pdf_count > 0 else JournalStatus.ERROR
            if pdf_count == 0:
                journal.error_message = "No PDFs downloaded"
            
            self.db.commit()
            print(f"✅ Downloaded {pdf_count} PDFs for journal {journal.journal_number}")
            
        except Exception as e:
            journal.status = JournalStatus.ERROR
            journal.error_message = str(e)
            self.db.commit()
            print(f"❌ Error downloading PDFs for journal {journal.journal_number}: {str(e)}")
    
    def _download_pdf_from_form(
        self, page: Page, form, filename: str, journal: Journal, 
        save_dir: Path, class_range: str
    ) -> Optional[PDFFile]:
        """
        Download a PDF by submitting a form
        """
        try:
            # Generate clean filename
            safe_filename = filename.split("\\")[-1].replace(" ", "_")
            filepath = save_dir / safe_filename
            
            # ✅ CHECK IF PDF ALREADY EXISTS (avoid duplicate downloads)
            existing_pdf = self.db.query(PDFFile).filter(
                PDFFile.journal_id == journal.id,
                PDFFile.file_name == safe_filename
            ).first()
            
            if existing_pdf and Path(existing_pdf.file_path).exists():
                print(f"  ⏭️  Skipped {safe_filename} - already exists")
                return existing_pdf
            
            # ✅ CHECK IF FILE ALREADY DOWNLOADED ON DISK
            if filepath.exists():
                file_size = filepath.stat().st_size
                if file_size > 0:  # Valid file
                    print(f"  ⏭️  File {safe_filename} exists on disk, creating DB record...")
                    
                    # Create DB record for existing file
                    pdf_file = PDFFile(
                        journal_id=journal.id,
                        file_name=safe_filename,
                        file_path=str(filepath),
                        class_range=class_range,
                        file_size_bytes=file_size,
                        download_url=filename,
                        download_date=datetime.utcnow(),
                        extraction_status=ExtractionStatus.PENDING
                    )
                    self.db.add(pdf_file)
                    self.db.commit()
                    self.db.refresh(pdf_file)
                    return pdf_file
                else:
                    # Delete empty/corrupted file
                    filepath.unlink()
            
            print(f"  📄 Downloading {safe_filename}...")
            
            # Click the button and wait for download
            with page.expect_download(timeout=settings.DOWNLOAD_TIMEOUT * 1000) as download_info:
                button = form.query_selector("button")
                button.click()
            
            download = download_info.value
            download.save_as(str(filepath))
            
            file_size = filepath.stat().st_size
            
            # Create PDF file record
            pdf_file = PDFFile(
                journal_id=journal.id,
                file_name=safe_filename,
                file_path=str(filepath),
                class_range=class_range,
                file_size_bytes=file_size,
                download_url=filename,  # Store original filename path
                download_date=datetime.utcnow(),
                extraction_status=ExtractionStatus.PENDING
            )
            
            self.db.add(pdf_file)
            self.db.commit()
            self.db.refresh(pdf_file)
            
            print(f"  ✅ Downloaded {safe_filename} ({file_size / 1024 / 1024:.2f} MB)")
            return pdf_file
            
        except Exception as e:
            print(f"  ❌ Error downloading PDF from form: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def _download_pdf(
        self, page: Page, url: str, journal: Journal, 
        save_dir: Path, class_range: str
    ) -> Optional[PDFFile]:
        """
        Download a single PDF file
        """
        try:
            # Make URL absolute if needed
            if url.startswith("/"):
                from urllib.parse import urljoin
                url = urljoin(self.BASE_URL, url)
            
            # Generate filename
            filename = f"journal_{journal.journal_number}_{class_range}.pdf"
            filepath = save_dir / filename
            
            print(f"  📄 Downloading {filename}...")
            
            # Download using Playwright
            with page.expect_download(timeout=settings.DOWNLOAD_TIMEOUT * 1000) as download_info:
                page.goto(url)
            
            download = download_info.value
            download.save_as(str(filepath))
            
            file_size = filepath.stat().st_size
            
            # Create PDF file record
            pdf_file = PDFFile(
                journal_id=journal.id,
                file_name=filename,
                file_path=str(filepath),
                class_range=class_range,
                file_size_bytes=file_size,
                download_url=url,
                download_date=datetime.utcnow(),
                extraction_status=ExtractionStatus.PENDING
            )
            
            self.db.add(pdf_file)
            self.db.commit()
            self.db.refresh(pdf_file)
            
            print(f"  ✅ Downloaded {filename} ({file_size / 1024 / 1024:.2f} MB)")
            return pdf_file
            
        except Exception as e:
            print(f"  ❌ Error downloading PDF: {str(e)}")
            return None
    
    def _extract_class_range(self, link_text: str, index: int) -> str:
        """
        Extract class range from link text or generate from index
        """
        # Common patterns in link text
        if "1-34" in link_text or "CLASS 1-34" in link_text.upper():
            return "1-34"
        elif "35-45" in link_text or "CLASS 35-45" in link_text.upper():
            return "35-45"
        elif "1-30" in link_text:
            return "1-30"
        elif "31-99" in link_text or "31" in link_text:
            return "31-99"
        else:
            # Default based on index
            return f"Part-{index + 1}"
