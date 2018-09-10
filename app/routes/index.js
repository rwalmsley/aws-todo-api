module.exports = (app) => {
    const todoController = require('../controllers');

    app.get('/', (request, response) => {
        response.send('Server is live.');
    });

    app.route('/todos')
        .get(todoController.listAll)
        .post(todoController.addItem);

    app.route('/todos/:todoId')
        .get(todoController.getItem)
        .put(todoController.updateItem)
        .delete(todoController.deleteItem);

    app.route('/todos/due')
        .get(todoController.getAllDue);
}