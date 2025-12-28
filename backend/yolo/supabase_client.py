# Supabase Python Client for Detection System
import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://wxvpjellodxhdttlwysn.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dnBqZWxsb2R4aGR0dGx3eXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTI5MjgsImV4cCI6MjA3Nzc2ODkyOH0.TX2cULDvs8jlYS7Fyu86fa_hiX4PEYFeJOEVVoCYpzU')

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_session(user_id: str) -> dict:
    """
    Create a new detection session
    
    Args:
        user_id: UUID of the authenticated user
        
    Returns:
        dict: Created session data with id
    """
    try:
        response = supabase.table('sessions').insert({
            'user_id': user_id,
            'status': 'active',
            'started_at': datetime.utcnow().isoformat()
        }).execute()
        
        if response.data and len(response.data) > 0:
            print(f"✅ Session created: {response.data[0]['id']}")
            return response.data[0]
        else:
            raise Exception("Failed to create session")
            
    except Exception as e:
        print(f"❌ Error creating session: {e}")
        raise

def finish_session(session_id: str) -> dict:
    """
    Mark a session as finished
    
    Args:
        session_id: UUID of the session
        
    Returns:
        dict: Updated session data
    """
    try:
        response = supabase.table('sessions').update({
            'status': 'finished',
            'ended_at': datetime.utcnow().isoformat()
        }).eq('id', session_id).execute()
        
        if response.data and len(response.data) > 0:
            print(f"✅ Session finished: {session_id}")
            return response.data[0]
        else:
            raise Exception("Failed to finish session")
            
    except Exception as e:
        print(f"❌ Error finishing session: {e}")
        raise

def upload_screenshot(user_id: str, session_id: str, image_bytes: bytes, filename: str) -> str:
    """
    Upload screenshot to Supabase Storage
    
    Args:
        user_id: UUID of the user
        session_id: UUID of the session
        image_bytes: Screenshot image data
        filename: Name for the file
        
    Returns:
        str: Public URL of the uploaded image
    """
    try:
        # Storage path: {user_id}/{session_id}/{filename}
        file_path = f"{user_id}/{session_id}/{filename}"
        
        # Upload to Supabase Storage
        response = supabase.storage.from_('detection-screenshots').upload(
            file_path,
            image_bytes,
            file_options={"content-type": "image/png"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_('detection-screenshots').get_public_url(file_path)
        
        print(f"✅ Screenshot uploaded: {filename}")
        return public_url
        
    except Exception as e:
        print(f"❌ Error uploading screenshot: {e}")
        raise

def save_screenshot_record(session_id: str, image_url: str, direction: str) -> dict:
    """
    Save screenshot record to database
    
    Args:
        session_id: UUID of the session
        image_url: URL of the uploaded screenshot
        direction: Direction detected (KIRI or KANAN)
        
    Returns:
        dict: Created screenshot record
    """
    try:
        response = supabase.table('session_screenshots').insert({
            'session_id': session_id,
            'image_url': image_url,
            'direction': direction,
            'captured_at': datetime.utcnow().isoformat()
        }).execute()
        
        if response.data and len(response.data) > 0:
            print(f"✅ Screenshot record saved: {direction}")
            return response.data[0]
        else:
            raise Exception("Failed to save screenshot record")
            
    except Exception as e:
        print(f"❌ Error saving screenshot record: {e}")
        raise

def update_preview_image(session_id: str, image_url: str) -> dict:
    """
    Update session preview image (if not already set)
    
    Args:
        session_id: UUID of the session
        image_url: URL of the image
        
    Returns:
        dict: Updated session data
    """
    try:
        # Only update if preview_image is null
        response = supabase.table('sessions').update({
            'preview_image': image_url
        }).eq('id', session_id).is_('preview_image', 'null').execute()
        
        if response.data and len(response.data) > 0:
            print(f"✅ Preview image set for session: {session_id}")
            return response.data[0]
        else:
            print(f"ℹ️ Preview image already set or session not found")
            return {}
            
    except Exception as e:
        print(f"❌ Error updating preview image: {e}")
        raise

def get_session(session_id: str) -> dict:
    """
    Get session by ID
    
    Args:
        session_id: UUID of the session
        
    Returns:
        dict: Session data
    """
    try:
        response = supabase.table('sessions').select('*').eq('id', session_id).single().execute()
        return response.data if response.data else {}
    except Exception as e:
        print(f"❌ Error getting session: {e}")
        return {}

def get_session_screenshots(session_id: str) -> list:
    """
    Get all screenshots for a session
    
    Args:
        session_id: UUID of the session
        
    Returns:
        list: List of screenshot records
    """
    try:
        response = supabase.table('session_screenshots').select('*').eq('session_id', session_id).order('captured_at').execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"❌ Error getting screenshots: {e}")
        return []
