const express = require('express');
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const router = express.Router();
router.use(auth);

//Get all notes for authenticated user
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Create a new note for authenticated user
router.post('/', async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const newNote = new Note({
      title,
      content,
      userId: req.user.id
    });
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

//Update a note by ID (only if it belongs to authenticated user)
router.put('/:id', async (req, res) => {
  try {
    const existingNote = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!existingNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const { title, content } = req.body;
    if (title !== undefined) existingNote.title = title;
    if (content !== undefined) existingNote.content = content;

    const updatedNote = await existingNote.save();
    res.json(updatedNote);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});


//Delete a note by ID (only if it belongs to authenticated user)
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json({ message: 'Note deleted successfully', id: req.params.id });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;