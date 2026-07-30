const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');

// Apply authentication middleware to all note routes
router.use(auth);

// @route   GET /api/notes
// @desc    Get all notes for authenticated user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/notes
// @desc    Create a new note for authenticated user
// @access  Private
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

// @route   PUT /api/notes/:id
// @desc    Update a note by ID (only if it belongs to authenticated user)
// @access  Private
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

// @route   DELETE /api/notes/:id
// @desc    Delete a note by ID (only if it belongs to authenticated user)
// @access  Private
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