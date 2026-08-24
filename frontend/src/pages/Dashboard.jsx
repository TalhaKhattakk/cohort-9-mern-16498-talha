import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, FileText } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import axiosClient from "../api/axiosClient";
import welcomeIllustration from "../assets/NoteNestWelcome.png";
import "./Dashboard.css";

function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [viewMode, setViewMode] = useState("idle");
  const [toast, setToast] = useState("");
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [, forceUpdate] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    onTransaction: () => {
      forceUpdate((n) => n + 1);
    },
  });

  useEffect(() => {
    fetchNotes();
    fetchUser();
  }, []);

  // toast will disappear after 2 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchNotes() {
    try {
      const res = await axiosClient.get("/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(res.data);
    } catch (err) {
      console.log(err.message);
    }
  }

  async function fetchUser() {
    try {
      const res = await axiosClient.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
    } catch (err) {
      console.log(err.message);
    }
  }

  // when a note is clicked in the sidebar, it will open in the main view
  function openNote(note) {
    setSelectedNote(note);
    setViewMode("detail");
  }

  // add note button in the sidebar
  function startNewNote() {
    setSelectedNote(null);
    setTitle("");
    editor.commands.setContent("");
    setViewMode("edit");
  }

  // will open the edit note view
  function startEditNote() {
    setTitle(selectedNote.title);
    editor.commands.setContent(selectedNote.content);
    setViewMode("edit");
  }

  function cancelEdit() {
    if (selectedNote) {
      setViewMode("detail");
    } else {
      setViewMode("idle");
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const content = editor.getHTML();
    try {
      let saved;
      if (selectedNote) {
        const res = await axiosClient.put(`/notes/${selectedNote._id}`, { title, content }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        saved = res.data;
      } else {
        const res = await axiosClient.post("/notes", { title, content }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        saved = res.data;
      }
      await fetchNotes();
      setSelectedNote(saved);
      setViewMode("detail");
      setToast("Note saved");
    } catch (err) {
      console.log(err.message);
      setToast("Something went wrong, note not saved");
    }
  }

  function requestDelete(note) {
    setNoteToDelete(note);
  }

  function cancelDelete() {
    setNoteToDelete(null);
  }

  async function confirmDelete() {
    try {
      await axiosClient.delete(`/notes/${noteToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchNotes();
      if (selectedNote && selectedNote._id === noteToDelete._id) {
        setSelectedNote(null);
        setViewMode("idle");
      }
      setToast("Note deleted");
    } catch (err) {
      console.log(err.message);
      setToast("Something went wrong, note not deleted");
    } finally {
      setNoteToDelete(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  // formats a timestamp like "Today, 5:33 PM"
  function formatTimestamp(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return isToday ? `Today, ${time}` : `${date.toLocaleDateString()}, ${time}`;
  }

  const filteredNotes = notes.filter((note) => {
  const query = search.toLowerCase();
  const titleMatch = note.title.toLowerCase().includes(query);
  const plainContent = note.content.replace(/<[^>]*>/g, "").toLowerCase();
  const contentMatch = plainContent.includes(query);
  return titleMatch || contentMatch;
  });

  return (
    <div className="dash-page">
      <div className="dash-sidebar">
        <div className="dash-logo-row">
          <img src="/NoteNestIcon.png" alt="" className="dash-logo-icon" />
          <div>
            <h2 className="dash-logo">NoteNest</h2>
            <p className="dash-logo-tagline">Your ideas, organized.</p>
          </div>
        </div>

        <input
          className="dash-search"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="dash-new-btn" onClick={startNewNote}>+ New Note</button>

        <p className="dash-notes-label">NOTES</p>

        <div className="dash-note-list">
          {filteredNotes.length === 0 && (
            <p className="dash-empty-hint">No notes yet</p>
          )}
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className={`dash-note-item ${selectedNote && selectedNote._id === note._id ? "active" : ""}`}
            >
              <div className="dash-note-icon">
                <FileText size={16} />
              </div>
              <button
                className="dash-note-select-btn"
                onClick={() => openNote(note)}
              >
                <span className="dash-note-title">{note.title}</span>
                <span className="dash-note-time">{formatTimestamp(note.updatedAt || note.createdAt)}</span>
              </button>
              <button
                className="dash-delete-btn"
                aria-label={`Delete ${note.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  requestDelete(note);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="dash-profile">
          {user && (
            <div className="dash-user-info">
              <div className="dash-user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
              <div>
                <div className="dash-user-name">{user.name}</div>
                <div className="dash-user-email">{user.email}</div>
              </div>
            </div>
          )}
          <button className="dash-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dash-main">

        {viewMode === "idle" && (
          <div className="dash-idle">
            <img src={welcomeIllustration} alt="" className="dash-idle-illustration" />
            <h2 className="dash-idle-title">Welcome to NoteNest</h2>
            <p className="dash-idle-text">Click <strong>+ New Note</strong> to get started</p>
          </div>
        )}

        {/* will show a read only view of the notes */}
        {viewMode === "detail" && selectedNote && (
          <div className="dash-detail">
            <h1 className="dash-detail-title">{selectedNote.title}</h1>
            <div
              className="dash-detail-content"
              dangerouslySetInnerHTML={{ __html: selectedNote.content }}
            />
            <div className="dash-detail-actions">
              <button className="dash-update-btn" onClick={startEditNote}>Update Note</button>
              <button className="dash-delete-note-btn" onClick={() => requestDelete(selectedNote)}>
                Delete Note
              </button>
            </div>
          </div>
        )}

        {/* this will highlight which tool is being used in the editor */}
        {viewMode === "edit" && (
          <form onSubmit={handleSave}>
            <input
              className="dash-title-input"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="dash-toolbar">
              <button
                type="button"
                className={editor?.isActive("bold") ? "active" : ""}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                B
              </button>
              <button
                type="button"
                className={editor?.isActive("italic") ? "active" : ""}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                I
              </button>
              <button
                type="button"
                className={editor?.isActive("strike") ? "active" : ""}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                S
              </button>
              <button
                type="button"
                className={editor?.isActive("heading", { level: 1 }) ? "active" : ""}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                H1
              </button>
              <button
                type="button"
                className={editor?.isActive("heading", { level: 2 }) ? "active" : ""}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                H2
              </button>
              <button
                type="button"
                className={editor?.isActive("bulletList") ? "active" : ""}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                • List
              </button>
              <button
                type="button"
                className={editor?.isActive("orderedList") ? "active" : ""}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                1. List
              </button>
            </div>

            <div className="dash-editor-wrapper">
              <EditorContent editor={editor} />
            </div>

            <div className="dash-edit-actions">
              <button type="submit" className="dash-save-btn">
                {selectedNote ? "Update Note" : "Save Note"}
              </button>
              <button type="button" className="dash-cancel-btn" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>


      {noteToDelete && (
        <div className="dash-modal-overlay">
          <div className="dash-modal">
            <p>Delete "{noteToDelete.title}"? This can't be undone.</p>
            <div className="dash-modal-actions">
              <button className="dash-delete-note-btn" onClick={confirmDelete}>Delete</button>
              <button className="dash-cancel-btn" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}


      {toast && <div className="dash-toast">{toast}</div>}
    </div>
  );
}

export default Dashboard;