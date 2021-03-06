module.exports = (app) => {
    const todoController = require('../controllers');

    app.get('/', (request, response) => {
        response.send('Server is live.');
    });

    app.route('/todos')
        .get(todoController.listAll)
        .post(todoController.addItem);

    app.route('/todos/due')
        .get(todoController.getAllDue);

    app.route('/todos/:id')
        .get(todoController.getItem)
        .put(todoController.updateItem)
        .delete(todoController.deleteItem);


}