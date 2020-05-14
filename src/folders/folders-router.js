const path = require('path')
const express = require('express')
const xss = require('xss')
const logger = require('../logger')
const foldersService = require('./folders-service')
const notesService = require('../notes/notes-service')
const foldersRouter = express.Router()
const bodyParser = express.json()

const serializeFolder = folder => ({
    id: folder.id,
    name: folder.name,
})

const serializeNote = note => ({
    id: note.id,
    name: note.name,
    modified: note.modified,
    folder_id: note.folder_id,
    content: note.content
})

foldersRouter
    .route('/')
    .get((req, res, next) => {
        console.log(req)
        foldersService.getAllFolders(req.app.get('db'))
            .then(folders => {
                res.json(folders.map(serializeFolder))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const name = req.body
        const newfolder = name

        for (const field of ['name']) {
            if (!newfolder[field]) {
                logger.error(`${field} is required`)
                return res.status(400).send({
                    error: { message: `'${field}' is required` }
                })
            }
        }
        foldersService.insertFolder(
            req.app.get('db'),
            newfolder
        )
            .then(folder => {
                logger.info(`folder with ${folder.id} has been created`)
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `${folder.id}`))
                    .json(serializeFolder(folder))
            })
            .catch(next)


    })

foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        // console.log(req)
        const { folder_id } = req.params
        foldersService.getFolderById(req.app.get('db'), folder_id)
            .then(folder => {
                if (!folder) {
                    logger.error(`folder with id ${folder_id} not found.`)
                    return res.status(404).json({
                        error: { message: `folder Not Found` }
                    })
                }

                res.folder = folder
                next()
            })

    })
    .get((req, res, next) => {
        console.log(req.params)
        notesService.getNoteByFolderId(req.app.get('db'), res.folder.id)
            .then(notes => {
                res.json(notes.map(serializeNote))
            })
            .catch(next)
    })

module.exports = foldersRouter