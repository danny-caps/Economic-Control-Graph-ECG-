"""
Main Runner for Economic Control Graph (ECG) & Correlation Risk Engine
Razorpay AI Risk Manager (Track 02) Buildathon MVP
"""

import uvicorn
import webbrowser
import threading
import time
import urllib.request

def open_browser():
    url = "http://localhost:8000"
    health_url = "http://127.0.0.1:8000/api/health"
    
    # Poll for up to 30 seconds until the backend is fully initialized
    for _ in range(60):
        try:
            with urllib.request.urlopen(health_url, timeout=1) as response:
                if response.status == 200:
                    break
        except Exception:
            time.sleep(0.5)
    
    try:
        webbrowser.open(url)
    except Exception:
        pass

    print("\n=======================================================")
    print(f"[OK] ECG Risk Engine Dashboard launched at: {url}")
    print(f"[OK] API Documentation (Swagger) at: {url}/docs")
    print("=======================================================\n")

if __name__ == "__main__":
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=False)

