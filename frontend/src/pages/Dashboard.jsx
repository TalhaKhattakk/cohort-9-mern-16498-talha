import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import "./Dashboard.css";

function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchNotes();
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

  function selectNote(note) {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
  }

  function startNewNote() {
    setSelectedNote(null);
    setTitle("");
    setContent("");
  }

  async function handleSave(e) {
    e.preventDefault();
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

  return (
    <div className="dash-page">
      <div className="dash-sidebar">
        <h2 className="dash-logo">TalhaNotes</h2>

        <button className="dash-new-btn" onClick={startNewNote}>+ New Note</button>

        <div className="dash-note-list">
          {notes.map((note) => (
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

        <button className="dash-logout-btn" onClick={handleLogout}>Logout</button>
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
          <textarea
            className="dash-content-input"
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            required
          />
          <button type="submit" className="dash-save-btn">
            {selectedNote ? "Update Note" : "Save Note"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Dashboard;