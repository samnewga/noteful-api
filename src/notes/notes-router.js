const path = require('path')
const express = require('express')
const xss = require('xss')
const logger = require('../logger')
const notesService = require('./notes-service')

const notesRouter = express.Router()
const bodyParser = express.json()

const serializeNote = note => ({
    id: note.id,
    name: note.name,
    modified: note.modified,
    folder_id: note.folder_id,
    content: note.content
})

notesRouter
    .route('/')
    .get((req, res, next) => {
        notesService.getAllNotes(req.app.get('db'))
            .then(notes => {
                res.json(notes.map(serializeNote))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { name, folder_id, content } = req.body
        const newNote = {
            name, folder_id, content
        }

        for (const field of ['name', 'folder_id', 'content']) {
            if (!newNote[field]) {
                logger.error(`${field} is required`)
                return res.status(400).send({
                    error: { message: `'${field}' is required` }
                })
            }
        }
        notesService.insertNote(
            req.app.get('db'),
            newNote
        )
            .then(note => {
                logger.info(`Note with ${note.id} has been created`)
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `${note.id}`))
                    .json(serializeNote(note))
            })
            .catch(next)


    })


notesRouter
    .route('/:note_id')
    .all((req, res, next) => {
        const { note_id } = req.params
        notesService.getNoteById(req.app.get('db'), note_id)
            .then(note => {
                if (!note) {
                    logger.error(`Note with id ${note_id} not found.`)
                    return res.status(404).json({
                        error: { message: `Note Not Found` }
                    })
                }

                res.note = note
                next()
            })
            .catch(next)
    })
    .get((req, res) => {
        res.json(serializeNote(res.note))
    })
    .delete((req, res, next) => {
        // const { note_id } = req.params
        // console.log(note_id)
        notesService.deleteNote(req.app.get('db'), res.note.id)
            .then(() => {
                logger.info(`Note with id ${res.note.id} deleted.`)
                res.status(204).end()
            })
            .catch(next)
    })
module.exports = notesRouter