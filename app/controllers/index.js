const dynamodb = require('../dynamodb');
const uuid = require('uuid');
const moment = require('moment');

exports.addItem = (request, response) => {
    const timestamp = new Date().getTime();

    const data = request.body;

    let isDue = false;
    if (data.dueDate) {
        isDue = moment(data.dueDate).isBefore();
    }
    const id = uuid.v1()

    const params = {
        TableName: process.env.DB_TABLE,
        Item: {
            id,
            title: data.title,
            description: data.description,
            isDue,
            dueDate: data.dueDate || null,
            createdAt: timestamp,
            updatedAt: timestamp,
            isDone: false,
        }
    };

    dynamodb.put(params, (error, result) => {

        if (error) {

            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        } else {
            response.send({
                success: true,
                message: 'Todo created successfully',
                id
            });
        }
    });

};

exports.listAll = (request, response) => {

    const params = {
        TableName: process.env.DB_TABLE
    };

    dynamodb.scan(params, (error, result) => {

        if (error) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        } else {
            response.send({
                success: true,
                message: `Successfully retreived todo list.`,
                total: result.Count,
                todos: result.Items
            });
        }
    });
}


exports.getItem = (request, response) => {

    const id = request.params.todoId;

    const params = {
        TableName: process.env.DB_TABLE,
        KeyConditionExpression: 'id = :i',
        ExpressionAttributeValues: {
            ':i': id
        }
    };

    dynamodb.query(params, (error, result) => {

        if (error) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        } else {
            const { Items } = result;

            if (Items.length > 0) {
                Items.forEach( item => {
                    checkIsDue(item);
                });
                checkIsDue(Items[0]);
            } else {
                response.send({
                    success: true,
                    message: `Successfully retreived todo.`,
                    Items
                });
            }
            
        }

    });
};


exports.deleteItem = (request, response) => {

    const id = request.params.todoId;

    const params = {
        TableName: process.env.DB_TABLE,
        Key: {
            id
        }
    };

    dynamodb.delete(params, (error) => {

        if (error) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        } else {
            response.send({
                success: true,
                message: `Successfully removed todo.`,
            });
        }
    })

};


exports.deleteAll = (request, response) => {

    var scanParams = {
        TableName: process.env.DB_TABLE
    }

    dynamodb.scan(scanParams, (error, data) => {
        if (error) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        } else {
            
            data.Items.forEach((item, idx) => {

                let params = {
                    TableName: process.env.DB_TABLE,
                    Key: {
                        id: item.id
                    },
                    ReturnValues: 'NONE',
                    ReturnConsumedCapacity: 'NONE',
                    ReturnItemCollectionMetrics: 'NONE'
                };

                dynamodb.delete(params, (err, data) => {
                    if (err) {
                        console.error(error);
                    } else {
                        console.log(data);
                    }
                })
            });
        }
    })

};


exports.updateItem = (request, response) => {

    const timestamp = new Date().getTime();
    const data = request.body;
    const id = request.params.todoId;

    let updateExpression = 'SET updatedAt = :updatedAt'
    let expressionAttributeNames = {};

    if (data.title) {
        updateExpression += ', #todo_title = :title';
        expressionAttributeNames['#todo_title'] = 'title';
    }

    if (data.description) {
        updateExpression += ', #todo_description = :description';
        expressionAttributeNames['#todo_description'] = 'description';
    }

    if (data.isDone) {
        updateExpression += ', isDone = :isDone';
    }

    if (data.dueDate) {
        updateExpression += ', dueDate = :dueDate';
    }

    const params = {
        TableName: process.env.DB_TABLE,
        Key: {
            id
        },
        ExpressionAttributeValues: {
            ':title': data.title,
            ':description': data.description,
            ':isDone': data.isDone,
            ':updatedAt': timestamp,
            ':dueDate': data.dueDate
        },
        ConditionExpression: 'attribute_exists(id)',
        UpdateExpression: updateExpression,
        ReturnValues: 'ALL_NEW',
    };

    if (Object.keys(expressionAttributeNames).length > 0) {
        params.ExpressionAttributeNames = expressionAttributeNames
    }

    dynamodb.update(params, (error, result) => {

        if (error) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        } else {
            console.log(result)
            response.send({
                success: true,
                message: `Successfully updated todo.`,
            });
        }
    });

};


exports.getAllDue = (request, response) => {

    const params = {
        TableName: process.env.DB_TABLE,
        KeyConditionExpression: 'isDue = :i',
        ExpressionAttributeValues: {
            ':i': true
        }
    };

    dynamodb.query(params, (error, result) => {

        if (error) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        } else {
            response.send({
                success: true,
                message: `Successfully retreived todo list.`,
                total: result.Count,
                todos: result.Items
            });
        }
    });

}


/**
 * Check if a todo item has a due date, and whether or not that due date
 * has past. Update the item if it is now due or if the due date has been updated.
 * @param {Object} todo the todo object
 */
const checkIsDue = (todo) => {

    // TODO: implement checkIsDue logic

    if (todo.dueDate) {

        const dueDate = moment(todo.dueDate);
        const isDue   = dueDate.isBefore();

        if (!todo.dueDate && isDue) {
            setIsDue(todo.id, true);
        }
        if (todo.dueDate && !isDue) {
            setIsDue(todo.id, false);
        }

    }

}


/**
 * Update isDue field of a todo item.
 * @param {Int} id the ID of the todo
 * @param {Boolean} isDue true if is due, false if it is not
 */
const setIsDue = (id, isDue) => {

    const params = {
        TableName: process.env.DB_TABLE,
        Key: {
            id
        },
        ExpressionAttributeValues: {
            ':isDue': isDue,
        },
        ConditionExpression: 'attribute_exists(id)',
        UpdateExpression: 'SET isDue = :isDue',
        ReturnValues: 'ALL_NEW',
    };


    dynamodb.update(params, (error, result) => {

        if (error) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        } else {
            console.log(result)
            response.send({
                success: true,
                message: `Successfully updated todo.`,
            });
        }
    });

}