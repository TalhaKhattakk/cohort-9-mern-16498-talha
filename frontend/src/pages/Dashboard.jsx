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

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
  });

  useEffect(() => {
    fetchNotes();
    fetchUser();
  }, []);

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

  function selectNote(note) {
    setSelectedNote(note);
    setTitle(note.title);
    editor.commands.setContent(note.content);
  }

  function startNewNote() {
    setSelectedNote(null);
    setTitle("");
    editor.commands.setContent("");
  }

  async function handleSave(e) {
    e.preventDefault();
    const content = editor.getHTML();
    try {
      if (selectedNote) {
        await axiosClient.put(`/notes/${selectedNote._id}`, { title, content }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axiosClient.post("/notes", { title, content }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchNotes();
      startNewNote();
    } catch (err) {
      console.log(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await axiosClient.delete(`/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotes();
      if (selectedNote && selectedNote._id === id) startNewNote();
    } catch (err) {
      console.log(err.message);
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
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className={`dash-note-item ${selectedNote && selectedNote._id === note._id ? "active" : ""}`}
              onClick={() => selectNote(note)}
            >
              <span>{note.title}</span>
              <button
                className="dash-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(note._id);
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
        <form onSubmit={handleSave}>
          <input
            className="dash-title-input"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="dash-editor-wrapper">
            <EditorContent editor={editor} />
          </div>

          <button type="submit" className="dash-save-btn">
            {selectedNote ? "Update Note" : "Save Note"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Dashboard;