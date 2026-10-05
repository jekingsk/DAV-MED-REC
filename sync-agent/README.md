# DAV University - Faculty PC Data Synchronization & Local Backup Agent

A lightweight desktop background utility for faculty members to maintain an automatic, verified local backup of all student medical leave applications and documents directly on their PC.

---

### How It Works

1. **Detects Unsynced Records**: Periodically checks the portal / Firebase Firestore for newly submitted or pending applications.
2. **Organized Hierarchy**: Automatically organizes records into:
   ```text
   Documents/DAV Medical Leave/
       2026-27/
           CSE/
               DAV-MED-2026-000124/
                   Application_Data.json
                   Medical_Leave_Application.html
                   Medical_Certificate.pdf
   ```
3. **Integrity Verification**: Computes SHA-256 hash of the downloaded records and confirms file existence.
4. **Cloudinary Cleanup**: Only after verified local storage, instructs the backend to delete the temporary medical proof from Cloudinary.
5. **Dashboard Integration**: Runs an embedded heartbeat service on `localhost:38291` so the web dashboard automatically displays your PC as "Connected ✓".

---

### Quick Start (Windows)

1. Double-click **`start-sync-agent.bat`** in this directory, OR run:
   ```cmd
   node faculty-sync-agent.js
   ```
2. The agent will immediately perform its initial sync and then monitor for incoming applications every 30 seconds.

---

### Configuration (Environment Variables)

| Variable | Default | Description |
|---|---|---|
| `PORTAL_URL` | `http://localhost:3000` | URL of the DAV Medical Leave Portal |
| `BACKUP_BASE_DIR` | `%USERPROFILE%\Documents\DAV Medical Leave` | Directory where backups are saved |
| `POLL_INTERVAL_SEC` | `30` | Check interval in seconds |
| `FACULTY_PC_ID` | `FACULTY-PC-{HOSTNAME}` | Unique identifier for the faculty PC |
