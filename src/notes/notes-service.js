const notesService = {
    getAllNotes(knex) {
        return knex.select('*').from('notes')
    },
    insertNote(knex, newNote) {
        return knex
            .insert(newNote)
            .into('notes')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getNoteById(knex, id) {
        return knex.from('notes').select('*').where('id', id).first()
    },
    getNoteByFolderId(knex, id) {
        return knex.select('*').from('notes').where('folder_id', id)
    },
    deleteNote(knex, id) {
        return knex('notes')
            .where({ id })
            .delete()
    },
    updateNote(knex, id, newNoteFields) {
        return knex('notes')
            .where({ id })
            .update(newNoteFields)
    },


}

module.exports = notesService