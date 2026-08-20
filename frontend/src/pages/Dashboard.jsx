import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import axiosClient from "../api/axiosClient";
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

  // toast will auto after some time
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

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dash-page">
      <div className="dash-sidebar">
        <h2 className="dash-logo">TalhaNotes</h2>

        <input
          className="dash-search"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="dash-new-btn" onClick={startNewNote}>+ Add Note</button>

        <div className="dash-note-list">
          {filteredNotes.length === 0 && (
            <p className="dash-empty-hint">No notes yet</p>
          )}
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className={`dash-note-item ${selectedNote && selectedNote._id === note._id ? "active" : ""}`}
            >
              <button
                className="dash-note-select-btn"
                onClick={() => openNote(note)}
              >
                {note.title}
              </button>
              <button
                className="dash-delete-btn"
                aria-label={`Delete ${note.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  requestDelete(note);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="dash-profile">
          {user && (
            <div className="dash-user-info">
              <div className="dash-user-name">{user.name}</div>
              <div className="dash-user-email">{user.email}</div>
            </div>
          )}
          <button className="dash-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dash-main">

        {viewMode === "idle" && (
          <div className="dash-idle">
            <button className="dash-add-big-btn" onClick={startNewNote}>+ Add Note</button>
          </div>
        )}

        //will show a read only view of the notes
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

        //this will highlight which toold is being used in the editor
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