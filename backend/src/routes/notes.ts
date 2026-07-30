import { Router, Response } from 'express';
import Note from '../models/Note';
import auth from '../middleware/auth';
import { AuthRequest, NoteRequestBody } from '../types';

const router = Router();

// Apply authentication middleware to all note routes
router.use(auth);

// @route   GET /api/notes
// @desc    Get all notes for authenticated user
// @access  Private
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(notes);
  } catch (error: unknown) {
    console.error('Error in GET /api/notes:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/notes
// @desc    Create a new note for authenticated user
// @access  Private
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { title, content }: NoteRequestBody = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const newNote = new Note({
      title,
      content,
      userId: req.user.id
    });

    const savedNote = await newNote.save();
    return res.status(201).json(savedNote);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error in POST /api/notes:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update a note by ID (only if it belongs to authenticated user)
// @access  Private
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const existingNote = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!existingNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const { title, content }: NoteRequestBody = req.body;
    if (title !== undefined) existingNote.title = title;
    if (content !== undefined) existingNote.content = content;

    const updatedNote = await existingNote.save();
    return res.json(updatedNote);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid note ID' });
      }
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
    }
    console.error('Error in PUT /api/notes/:id:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete a note by ID (only if it belongs to authenticated user)
// @access  Private
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    return res.json({ message: 'Note deleted successfully', id: req.params.id });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    console.error('Error in DELETE /api/notes/:id:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
